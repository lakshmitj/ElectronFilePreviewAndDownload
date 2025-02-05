document.getElementById('selectFile').addEventListener('click', async () => {
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

document.getElementById('downloadFile').addEventListener('click', async () => {
  const filePath = document.getElementById('downloadFile').dataset.filePath;
  if (filePath) 
  {
    defaultPath = document.getElementById('downloadPath').value;
    const prams = {
      defaultPath: defaultPath,
      filePath: filePath
    };
    const savePath = await window.electron.invoke('download-file', prams);
    if(savePath) {
      document.getElementById('downloadPath').value = savePath;  // Update the textbox
      alert(`File saved to: ${savePath}`);

    } else {
      alert('No folder selected or operation canceled.');
    }
  } else {
      alert('No file selected to download.');
  }
});

document.getElementById('browserdownloadPath').addEventListener('click', async () => {
  const filePath = document.getElementById('downloadFile').dataset.filePath;
  if(filePath) 
  {
    defaultPath = document.getElementById('downloadPath').value;

    window.electron.invoke('browser-download-path', defaultPath);

  } else {
    alert('No file selected to download.');
  }
});