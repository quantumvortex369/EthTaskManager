import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Contract } from 'ethers';

// Agregar estilos CSS
const styles = `
  :root {
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;
  }

  body {
    margin: 0;
    display: flex;
    place-items: center;
    min-width: 320px;
    min-height: 100vh;
  }

  h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }

  .container {
    max-width: 800px;
    width: 100%;
    padding: 2rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    border: 1px solid transparent;
    font-weight: 500;
    font-size: 1rem;
    background-color: #60a5fa;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .btn:hover {
    background-color: #3b82f6;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input {
    padding: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #e5e7eb;
    font-size: 1rem;
  }

  .task {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    margin-bottom: 1rem;
  }

  .task.completed {
    background-color: #f3f4f6;
  }

  .error {
    background-color: #fee2e2;
    color: #991b1b;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }`

interface Task {
  id: number;
  description: string;
  completed: boolean;
  timestamp: number;
  creator: string;
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Función para conectar MetaMask
  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        setError('Por favor, instala MetaMask para usar esta aplicación');
        return;
      }

      // Solicitar conexión
      await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Cambiar a la red Goerli
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x5' }] // Goerli (5)
        });
      } catch (switchError) {
        // Esto puede ocurrir si la red no está añadida
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x5',
            chainName: 'Goerli',
            nativeCurrency: {
              name: 'Goerli ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://goerli.infura.io/v3/YOUR_INFURA_ID']
          }]
        });
      }

      // Inicializar el contrato
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);

      // ABI del contrato
      const abi: string[] = [
        'function createTask(string memory _description) public',
        'function completeTask(uint256 _taskId) public',
        'function deleteTask(uint256 _taskId) public',
        'function getTask(uint256 _taskId) public view returns (string, bool, uint256, address)',
        'function getUserTasks(address _user) public view returns (uint256[] memory)',
        'event TaskCreated(uint256 indexed taskId, string description, address indexed creator)',
        'event TaskCompleted(uint256 indexed taskId, address indexed completer)',
        'event TaskDeleted(uint256 indexed taskId, address indexed deleter)'
      ];

      // Dirección del contrato (cambia esto por tu dirección desplegada)
      // Para pruebas, usa esta dirección de ejemplo en Goerli:
      const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const contract = new Contract(contractAddress, abi, signer);
      setContract(contract);

      // Cargar tareas
      await loadTasks();

      // Escuchar eventos del contrato
      contract.on('TaskCreated', (taskId: number, description: string, creator: string) => {
        console.log('Nueva tarea creada:', { taskId, description, creator });
        loadTasks();
      });

      contract.on('TaskCompleted', (taskId: number, completer: string) => {
        console.log('Tarea completada:', { taskId, completer });
        loadTasks();
      });

      contract.on('TaskDeleted', (taskId: number, deleter: string) => {
        console.log('Tarea eliminada:', { taskId, deleter });
        loadTasks();
      });

    } catch (error: any) {
      setError(error.message || 'Error al conectar con MetaMask');
      console.error('Error connecting wallet:', error);
    }
  };

  // Funciones de manejo de tareas
  const addTask = async () => {
    if (!newTask.trim() || !contract) return;
    setLoading(true);
    setError('');
    try {
      const tx = await contract.createTask(newTask);
      await tx.wait();
      setNewTask('');
      await loadTasks();
    } catch (error: any) {
      setError(error.message || 'Error al crear la tarea');
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: number) => {
    if (!contract) return;
    setLoading(true);
    setError('');
    try {
      const tx = await contract.completeTask(taskId);
      await tx.wait();
      await loadTasks();
    } catch (error: any) {
      setError(error.message || 'Error al completar la tarea');
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!contract) return;
    setLoading(true);
    setError('');
    try {
      const tx = await contract.deleteTask(taskId);
      await tx.wait();
      await loadTasks();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar la tarea');
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!contract || !account) return;
    setError('');
    try {
      const userTasks = await contract.getUserTasks(account);
      const tasksArray: Task[] = [];
      for (const taskId of userTasks) {
        const [description, completed, timestamp, creator] = await contract.getTask(taskId);
        tasksArray.push({
          id: Number(taskId),
          description: description as string,
          completed: completed as boolean,
          timestamp: Number(timestamp),
          creator: creator as string
        });
      }
      setTasks(tasksArray);
    } catch (error: any) {
      setError(error.message || 'Error al cargar las tareas');
      console.error('Error loading tasks:', error);
    }
  };

  // Efectos
  useEffect(() => {
    const initContract = async () => {
      try {
        if (!(window as any).ethereum) {
          setError('Por favor, instala MetaMask para usar esta aplicación');
          return;
        }

        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        // ABI del contrato
        const abi: string[] = [
          'function createTask(string memory _description) public',
          'function completeTask(uint256 _taskId) public',
          'function deleteTask(uint256 _taskId) public',
          'function getTask(uint256 _taskId) public view returns (string, bool, uint256, address)',
          'function getUserTasks(address _user) public view returns (uint256[] memory)',
          'event TaskCreated(uint256 indexed taskId, string description, address indexed creator)',
          'event TaskCompleted(uint256 indexed taskId, address indexed completer)',
          'event TaskDeleted(uint256 indexed taskId, address indexed deleter)'
        ];

        // Dirección del contrato (cambia esto por tu dirección desplegada)
        const contractAddress = 'TU_CONTRATO_DEPLOYED_ADDRESS';
        const contract = new Contract(contractAddress, abi, signer);
        setContract(contract);

        // Escuchar eventos del contrato
        contract.on('TaskCreated', (taskId: number, description: string, creator: string) => {
          console.log('Nueva tarea creada:', { taskId, description, creator });
          loadTasks();
        });

        contract.on('TaskCompleted', (taskId: number, completer: string) => {
          console.log('Tarea completada:', { taskId, completer });
          loadTasks();
        });

        contract.on('TaskDeleted', (taskId: number, deleter: string) => {
          console.log('Tarea eliminada:', { taskId, deleter });
          loadTasks();
        });

      } catch (error: any) {
        setError(error.message || 'Error al conectar con el contrato');
        console.error('Error initializing contract:', error);
      }
    };

    if ((window as any).ethereum) {
      initContract();
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [contract, account]);

  if (!account) {
    return (
      <div className="container">
        <h1 className="text-3xl font-bold mb-4">Task Manager Blockchain</h1>
        <div className="error">
          <p>Por favor, conecta tu wallet MetaMask para continuar</p>
          <button onClick={connectWallet} className="btn mt-2">
            Conectar Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Task Manager Blockchain</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nueva tarea..."
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={addTask}
            className="btn"
            disabled={loading || !newTask.trim()}
          >
            {loading ? 'Procesando...' : 'Añadir Tarea'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded ${
              task.completed ? 'bg-gray-100' : 'bg-white'
            } border border-gray-200`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span
                  className={`font-medium ${
                    task.completed ? 'line-through text-gray-500' : 'text-black'
                  }`}
                >
                  {task.description}
                </span>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Creado por: {task.creator.slice(0, 6)}...{task.creator.slice(-4)}</p>
                  <p>Fecha: {new Date(task.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => completeTask(task.id)}
                  className={`px-4 py-2 rounded ${
                    task.completed 
                      ? 'bg-green-200 text-green-700' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  disabled={loading || task.completed}
                >
                  {task.completed ? 'Completada' : 'Completar'}
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  disabled={loading}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;
