document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskForm = document.getElementById('addTaskForm');
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const clearAllBtn = document.getElementById('clearAll');
  
    // Load theme
    chrome.storage.local.get(['theme'], (result) => {
      if (result.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
      }
    });
  
    // Toggle theme
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeToggle.textContent = isDark ? '🌙' : '☀️';
      chrome.storage.local.set({ theme: isDark ? 'light' : 'dark' });
    });
  
    // Load tasks
    const loadTasks = () => {
      chrome.storage.local.get(['tasks'], (result) => {
        const tasks = result.tasks || [];
        
        // Sort tasks: incomplete first (sorted by newest), then completed
        const sortedTasks = tasks.sort((a, b) => {
          if (a.completed === b.completed) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.completed ? 1 : -1;
        });
        
        taskList.innerHTML = '';
        sortedTasks.forEach((task) => {
          const taskElement = createTaskElement(task);
          taskList.appendChild(taskElement);
        });
      });
    };
  
    // Create task element
    const createTaskElement = (task) => {
      const div = document.createElement('div');
      div.className = 'task-item';
      div.innerHTML = `
        <div class="task-content">
          <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
          <div class="task-buttons">
            <button class="action-btn edit" data-id="${task.id}">Edit</button>
            <button class="action-btn delete" data-id="${task.id}">Delete</button>
            <button class="action-btn done" data-id="${task.id}">
              ${task.completed ? 'Undo' : 'Done'}
            </button>
          </div>
        </div>
      `;
  
      // Edit task
      div.querySelector('.edit').addEventListener('click', () => {
        const textDiv = div.querySelector('.task-text');
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = task.text;
        inputField.className = 'edit-input';
        textDiv.replaceWith(inputField);
        inputField.focus();
  
        inputField.addEventListener('blur', () => {
          const newText = inputField.value.trim();
          if (newText && newText !== task.text) {
            updateTask(task.id, { ...task, text: newText });
          }
          loadTasks();
        });
  
        inputField.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            inputField.blur();
          }
        });
      });
  
      // Delete task
      div.querySelector('.delete').addEventListener('click', () => {
        deleteTask(task.id);
      });
  
      // Toggle completion
      div.querySelector('.done').addEventListener('click', () => {
        updateTask(task.id, { ...task, completed: !task.completed });
      });
  
      return div;
    };
  
    // Add new task
    addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = taskInput.value.trim();
      if (!text) return;
  
      chrome.storage.local.get(['tasks'], (result) => {
        const tasks = result.tasks || [];
        const newTask = {
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        chrome.storage.local.set({ tasks }, loadTasks);
      });
  
      taskInput.value = '';
    });
  
    // Update task
    const updateTask = (taskId, updatedTask) => {
      chrome.storage.local.get(['tasks'], (result) => {
        const tasks = result.tasks || [];
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
          tasks[taskIndex] = updatedTask;
          chrome.storage.local.set({ tasks }, loadTasks);
        }
      });
    };
  
    // Delete task
    const deleteTask = (taskId) => {
      chrome.storage.local.get(['tasks'], (result) => {
        const tasks = result.tasks || [];
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        chrome.storage.local.set({ tasks: filteredTasks }, loadTasks);
      });
    };
  
    // Clear all tasks
    clearAllBtn.addEventListener('click', () => {
      chrome.storage.local.set({ tasks: [] }, loadTasks);
    });
  
    // Initial load
    loadTasks();
  });