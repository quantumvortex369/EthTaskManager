pragma solidity ^0.8.0;

contract TaskManager {
    struct Task {
        string description;
        bool completed;
        uint256 timestamp;
        address creator;
    }

    uint256 public taskCount;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;

    event TaskCreated(uint256 indexed taskId, string description, address indexed creator);
    event TaskCompleted(uint256 indexed taskId, address indexed completer);
    event TaskDeleted(uint256 indexed taskId, address indexed deleter);

    modifier onlyExistingTask(uint256 _taskId) {
        require(_taskId > 0 && _taskId <= taskCount, "Invalid task ID");
        require(bytes(tasks[_taskId].description).length > 0, "Task does not exist");
        _;
    }

    modifier onlyTaskCreator(uint256 _taskId) {
        require(tasks[_taskId].creator == msg.sender, "Only task creator can perform this action");
        _;
    }

    function createTask(string memory _description) public {
        require(bytes(_description).length > 0, "Task description cannot be empty");
        
        taskCount++;
        tasks[taskCount] = Task({
            description: _description,
            completed: false,
            timestamp: block.timestamp,
            creator: msg.sender
        });
        userTasks[msg.sender].push(taskCount);
        
        emit TaskCreated(taskCount, _description, msg.sender);
    }

    function completeTask(uint256 _taskId) public onlyExistingTask(_taskId) {
        require(!tasks[_taskId].completed, "Task is already completed");
        
        tasks[_taskId].completed = true;
        emit TaskCompleted(_taskId, msg.sender);
    }

    function deleteTask(uint256 _taskId) public onlyExistingTask(_taskId) onlyTaskCreator(_taskId) {
        delete tasks[_taskId];
        
        // Remove task from user's task list
        uint256[] storage userTaskList = userTasks[msg.sender];
        for (uint256 i = 0; i < userTaskList.length; i++) {
            if (userTaskList[i] == _taskId) {
                userTaskList[i] = userTaskList[userTaskList.length - 1];
                userTaskList.pop();
                break;
            }
        }
        
        emit TaskDeleted(_taskId, msg.sender);
    }

    function getTask(uint256 _taskId) public view onlyExistingTask(_taskId) returns (string memory, bool, uint256, address) {
        Task memory task = tasks[_taskId];
        return (task.description, task.completed, task.timestamp, task.creator);
    }

    function getUserTasks(address _user) public view returns (uint256[] memory) {
        return userTasks[_user];
    }

    function getTaskCount() public view returns (uint256) {
        return taskCount;
    }
}
