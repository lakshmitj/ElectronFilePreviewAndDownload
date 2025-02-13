
//require() won't work in a pure browser-based renderer unless 
// Node integration is enabled (nodeIntegration: true in webPreferences), which 
// is not recommended for security reasons.
// If you use Webpack, this works fine.
//const { logMessage } = require('./log-util".js');

window.electron.invoke('get-parent-dom-value').then((parentDomValues) => {
    const methodName = 'get-parent-dom-value';
    const logMain = `[Modal-Renderer] ${methodName}`
    console.log(logMain);

    console.log(`${logMain}:Parent DOM values: ${JSON.stringify(parentDomValues)}`);
    logMessage('info',`${logMain}:Parent DOM values: ${JSON.stringify(parentDomValues)}`);

    // You can now manipulate the modal DOM with the value from the parent window
    document.getElementById('downloadPath').value = parentDomValues.downloadPath;
    document.getElementById('downloadFile').dataset.filePath = parentDomValues.filePath;
});

// Close the modal when the close button is clicked
// Handle modal close
document.getElementById('closeModalBtn').addEventListener('click', () => {
    closeModal();
});

document.getElementById('closeModalBtnX').addEventListener('click', () => {
    closeModal();
});

function closeModal(){
    console.log('Close button clicked');  // For debugging
    logMessage('info', 'Close button clicked');
    window.electron.invoke('close-modal');
}

document.getElementById('selectPath').addEventListener('click', async () => {
    const methodName = 'selectPath';
    const logMain = `[Modal-Renderer] ${methodName}`
    console.log(logMain);

    const filePath = document.getElementById('downloadFile').dataset.filePath;
    if(filePath) 
    {
        const defaultPath = document.getElementById('downloadPath').value;
        logMessage('info',`${logMain}:defaultPath: ${defaultPath}`);

        const folderPath = await window.electron.invoke('select-path', defaultPath);

        if(folderPath){
            document.getElementById('downloadPath').value = folderPath;  // Update the textbox
            logMessage('info',`${logMain}:defaultPath: ${folderPath}`);

            alert(`Selected download folder Path: ${folderPath}`);

        }else{
            alert('No folder selected or operation canceled.');
        }
    } else {
        alert('No file selected to download.');
    }
});

document.getElementById('downloadFile').addEventListener('click', async () => {
    const methodName = 'downloadFile';
    const logMain = `[Modal-Renderer] ${methodName}`
    console.log(logMain);
    logMessage('info', logMain);

    const filePath = document.getElementById('downloadFile').dataset.filePath;
    if(filePath) {
        const defaultPath = document.getElementById('downloadPath').value;
        const params = {
            defaultPath: defaultPath,
            filePath: filePath
        };
        
        logMessage('info',`${logMain}:File params ${JSON.stringify(params)}`);

        const savePath = await window.electron.invoke('download-file', params);
        if(savePath) {
            // Update the textbox
            document.getElementById('downloadPath').value = savePath;  
            logMessage('info',`${logMain}:File save path ${savePath}`);

            alert(`File saved to: ${savePath}`);
        } else {
            alert('No folder selected or operation canceled.');
        }
    } else {
        alert('No file selected to download.');
    }
});