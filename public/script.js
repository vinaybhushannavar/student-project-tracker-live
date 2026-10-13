// public/script.js

const message = document.querySelector('#message');
const projectForm = document.querySelector('#project-form');
const projectNameInput = document.querySelector('#name');
const projectStatusSelect = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const submitBtn = projectForm ? projectForm.querySelector('button[type="submit"]') : null;

let projects = [];
let editingId = null;

// Helper to display status, loading, saving, or error messages
function showMessage(text, isError = false) {
  if (message) {
    message.textContent = text;
    message.style.color = isError ? '#d9534f' : '#222';
  }
}

// Helper to disable/enable mutation controls during pending network calls
function setMutationsDisabled(disabled) {
  if (projectNameInput) projectNameInput.disabled = disabled;
  if (projectStatusSelect) projectStatusSelect.disabled = disabled;
  if (submitBtn) submitBtn.disabled = disabled;
  
  // Also disable edit/delete buttons dynamically if present
  const actionButtons = projectList.querySelectorAll('button');
  actionButtons.forEach(btn => btn.disabled = disabled);
}

// Load projects from the API
async function loadProjects() {
  showMessage('Loading projects...');
  if (emptyState) emptyState.style.display = 'none';

  try {
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from server.');
    }

    projects = data;
    renderProjects();
    
    if (projects.length === 0) {
      showMessage('No projects found.');
      if (emptyState) emptyState.style.display = 'block';
    } else {
      showMessage('');
    }
  } catch (error) {
    console.error('Load failed:', error);
    showMessage(`Error: Could not load projects from server. (${error.message})`, true);
    // Crucial: An unsuccessful load shows an error and does NOT pretend the list is empty successfully
    if (emptyState) emptyState.style.display = 'none';
  }
}

// Render projects into the DOM securely using textContent
function renderProjects() {
  if (!projectList) return;
  projectList.innerHTML = '';

  projects.forEach(project => {
    const li = document.createElement('li');

    const span = document.createElement('span');
    span.textContent = `${project.name} — Status: ${project.status}`;
    li.appendChild(span);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.marginLeft = '10px';
    editBtn.addEventListener('click', () => startEdit(project));
    li.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.marginLeft = '5px';
    deleteBtn.addEventListener('click', () => deleteProject(project.id));
    li.appendChild(deleteBtn);

    projectList.appendChild(li);
  });
}

// Enter Edit mode
function startEdit(project) {
  editingId = project.id;
  if (projectNameInput) projectNameInput.value = project.name;
  if (projectStatusSelect) projectStatusSelect.value = project.status;
  if (submitBtn) submitBtn.textContent = 'Save Changes';
  
  // Add a cancel button if not already present
  let cancelBtn = document.querySelector('#cancel-edit-btn');
  if (!cancelBtn && projectForm) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit-btn';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel edit';
    cancelBtn.style.marginLeft = '8px';
    cancelBtn.addEventListener('click', cancelEdit);
    projectForm.appendChild(cancelBtn);
  }
  showMessage(`Editing project #${project.id}`);
}

// Cancel edit mode
function cancelEdit() {
  editingId = null;
  if (projectForm) projectForm.reset();
  if (submitBtn) submitBtn.textContent = 'Add project';
  const cancelBtn = document.querySelector('#cancel-edit-btn');
  if (cancelBtn) cancelBtn.remove();
  showMessage('');
}

// Handle form submission (Create or Update)
if (projectForm) {
  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = projectNameInput ? projectNameInput.value.trim() : '';
    const status = projectStatusSelect ? projectStatusSelect.value : 'Planned';

    if (!name) {
      showMessage('Project name cannot be empty.', true);
      return;
    }

    setMutationsDisabled(true);
    showMessage(editingId ? 'Saving changes...' : 'Adding project...');

    try {
      let response;
      if (editingId) {
        // Update existing project (PUT)
        response = await fetch(`/api/projects/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, status })
        });
      } else {
        // Create new project (POST)
        response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, status })
        });
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error! status: ${response.status}`);
      }

      // Success
      showMessage(editingId ? 'Project updated successfully!' : 'Project added successfully!');
      cancelEdit(); // Reset form & edit mode
      await loadProjects(); // Refresh collection
    } catch (error) {
      console.error('Mutation failed:', error);
      // Preserve unsaved input when saving fails
      showMessage(`Error: Operation failed. (${error.message})`, true);
    } finally {
      // Restore controls in finally after both success and failure
      setMutationsDisabled(false);
    }
  });
}

// Delete project with confirmation
async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) {
    return; // Preserve cancellation without sending mutation request
  }

  setMutationsDisabled(true);
  showMessage('Deleting project...');

  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error! status: ${response.status}`);
    }

    // If the record being edited is deleted, reset Edit mode
    if (editingId === id) {
      cancelEdit();
    }

    showMessage('Project deleted successfully!');
    await loadProjects();
  } catch (error) {
    console.error('Delete failed:', error);
    showMessage(`Error: Could not delete project. (${error.message})`, true);
  } finally {
    setMutationsDisabled(false);
  }
}

// Initial load on page start
loadProjects();