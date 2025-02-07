let logTimeout;
    function logMessage2(logMessage) {
      clearTimeout(logTimeout);
      logTimeout = setTimeout(() => {
        window.electronLog.log('info', logMessage);
      }, 500); // Avoid spamming logs

      
    }
    function logMessage(logMessage) {
      window.electronLog.log('info', logMessage);
    }

    window.electron.invoke('get-parent-dom-value').then((parentValue) => {
      console.log('Parent DOM value:', parentValue);
      console.log('Parent DOM value - defaultPath:', parentValue.downloadPath);
      console.log('Parent DOM value - filePath:', parentValue.filePath);

       logMessage(`Parent DOM value - defaultPath: ${parentValue.downloadPath}`)
       logMessage(`Parent DOM value - filePath: ${parentValue.filePath}`);

      // You can now manipulate the modal DOM with the value from the parent window
      document.getElementById('downloadPath').value = parentValue.downloadPath;
      document.getElementById('downloadFile').dataset.filePath = parentValue.filePath;
    });
    // Close the modal when the close button is clicked
    // Handle modal close
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      //console.log('Close button clicked');  // For debugging
      //window.electron.invoke('close-modal');
      closeModal();
    });
    document.getElementById('closeModalBtnX').addEventListener('click', () => {
      //console.log('Close button clicked');  // For debugging
      //window.electron.invoke('close-modal');
      closeModal();
    });

    function closeModal(){
      console.log('Close button clicked');  // For debugging
      window.electron.invoke('close-modal');
    }

    document.getElementById('selectPath').addEventListener('click', async () => {
    const filePath = document.getElementById('downloadFile').dataset.filePath;
    if(filePath) 
    {
        defaultPath = document.getElementById('downloadPath').value;
       // window.electronLog.log('info', `Modal:selectPath:defaultPath: ${defaultPath}`);
       // logMessage(`Modal:selectPath:defaultPath: ${defaultPath}`)
        const folderPath = await window.electron.invoke('select-path', defaultPath);

        if(folderPath){
          document.getElementById('downloadPath').value = folderPath;  // Update the textbox
          
          logMessage(`Modal:selectPath:Selected download folder Path: ${folderPath}`);
          
          alert(`Selected download folder Path: ${folderPath}`);

        }else{
          // window.electronLog.log('info', 'Modal:selectPath: No folder selected or operation canceled');
         // logMessage('Modal:selectPath: No folder selected or operation canceled');
          alert('No folder selected or operation canceled.');
        }
    } else {
      //window.electronLog.log('info', `Modal:selectPath: No file selected to download.`);
      //logMessage(`Modal:selectPath: No file selected to download.`);
      alert('No file selected to download.');
    }
  });


document.getElementById('downloadFile').addEventListener('click', async () => {
  const filePath = document.getElementById('downloadFile').dataset.filePath;
  if (filePath) {
      
      defaultPath = document.getElementById('downloadPath').value;
      const prams = {
        defaultPath: defaultPath,
        filePath: filePath
      };
      //window.electronLog.log('info', `Modal:downloadFile:defaultPath: ${defaultPath}`);
      logMessage(`Modal:downloadFile:defaultPath: ${JSON.stringify(prams)}`);

      const savePath = await window.electron.invoke('download-file', prams);
      if(savePath){

        document.getElementById('downloadPath').value = savePath;  // Update the textbox
       // window.electronLog.log('info', `Modal:downloadFile:File saved to: ${savePath}`);
        alert(`File saved to: ${savePath}`);

      }else{
        //window.electronLog.log('info', `Modal:downloadFile:No folder selected or operation canceled.`);
        alert('No folder selected or operation canceled.');
      }
    } else {
     // window.electronLog.log('info', `Modal:downloadFile:No file selected to download.`);
      alert('No file selected to download.');
    }
  });
