(function() {
    var latestResult = null;
    var uploadElement = document.getElementById("mammoth-docx-upload");
    var loadingElement = document.getElementById("mammoth-docx-loading");
    
    uploadElement.addEventListener('change', function() {
        loadingElement.style.display = "block";
    }, false);
    
    mammoth.fileInput(
        uploadElement,
        function(result) {
            latestResult = result;
            loadingElement.style.display = "none";
            document.getElementById("mammoth-docx-raw-preview").innerHTML = escapeHtml(result.value);
        }
    );
    
    document.getElementById("mammoth-docx-insert").addEventListener("click", function() {
        if(!tinyMCE.activeEditor || tinyMCE.activeEditor.isHidden()) {
            insertText(document.getElementById("content"), latestResult.value);
        } else {
            tinyMCE.execCommand('mceInsertRawHTML', false, latestResult.value);
        }
    }, false);

    function insertText(element, text) {
        var startPosition = element.selectionStart;
        element.value = 
            element.value.substring(0, startPosition) +
            text +
            element.value.substring(element.selectionEnd);
        
        var newStartPosition = startPosition + text.length;
        element.selectionStart = newStartPosition;
        element.selectionEnd = newStartPosition;
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
})();
