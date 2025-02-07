
//require() won't work in a pure browser-based renderer unless 
// Node integration is enabled (nodeIntegration: true in webPreferences), which 
// is not recommended for security reasons.
// If you use Webpack, this works fine.
//const { logMessage } = require('./log-util".js');

document.getElementById('selectFile').addEventListener('click', async () => {
  
  const methodName = 'selectFile';
  const logMain = `[index-renderer] ${methodName}`
  console.log(logMain);

  logMessage('info', logMain);

  const file = await window.electron.invoke('select-file');
  if (file) {
    document.getElementById('filePath').textContent = file.path;
    document.getElementById('downloadFile').dataset.filePath = file.path;
    const fileContent = document.getElementById('fileContent');
    const filePreview = document.getElementById('filePreview');

    const defaultPath = await window.electron.invoke('get-default-download-path');
    // Set the default path in the downloadPath textbox
    document.getElementById('downloadPath').value = defaultPath;
    
    if (file.type === 'image') {
      fileContent.style.display = 'none';
      filePreview.style.display = 'block';
      filePreview.src = file.path;
    } else {
      filePreview.style.display = 'none';
      fileContent.style.display = 'block';
      fileContent.textContent = file.content;
    }
  }
});

document.getElementById('browserdownloadPath').addEventListener('click', async () => {
  const methodName = 'browserdownloadPath';
  const logMain = `[index-renderer] ${methodName}`
  console.log(logMain);

  const filePath = document.getElementById('downloadFile').dataset.filePath;
  if(filePath) 
  {
    defaultPath = document.getElementById('downloadPath').value;
    logMessage('info',`${logMain}: defaultPath ${defaultPath}`);

    window.electron.invoke('browser-download-path', defaultPath);

  } else {
    alert('No file selected to download.');
  }
});