# Task Manager DApp

Una aplicación descentralizada de gestión de tareas construida con React y Solidity.

## Características

- Crear tareas en la blockchain
- Marcar tareas como completadas
- Eliminar tareas
- Ver historial de tareas
- Interfaz de usuario moderna con React

## Tecnologías utilizadas

- Frontend: React + Vite
- Blockchain: Solidity (Ethereum)
- Herramientas de desarrollo: Hardhat
- Web3: Ethers.js y Web3.js

## Requisitos previos

- Node.js (versión 14 o superior)
- npm o yarn
- MetaMask (para interactuar con la DApp)
- Una red Ethereum (local o testnet)

## Instalación

1. Clona el repositorio:
```bash
git clone [github.com/quantumvortex369/EthTaskManager]
cd task-manager
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el proyecto:
```bash
./start.sh
```

Alternativamente, puedes usar:
```bash
npm run dev
```

## 🏃‍♂️ Uso

1. Conéctate a tu wallet MetaMask
2. Crea nuevas tareas usando el formulario
3. Marca tareas como completadas
4. Elimina tareas que ya no necesites

## Contrato inteligente

El contrato inteligente `TaskManager.sol` permite:
- Crear nuevas tareas
- Marcar tareas como completadas
- Eliminar tareas
- Emitir eventos para todas las acciones

## Contribución

¡Las contribuciones son bienvenidas! Siéntete libre de abrir un issue o pull request.
