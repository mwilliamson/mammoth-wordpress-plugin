(function() {
    var latestResult = null;
    var uploadElement = document.getElementById("mammoth-docx-upload");
    var parentElement = document.getElementById("mammoth-docx-uploader");
    
    uploadElement.addEventListener('change', function() {
        parentElement.className = "status-loading";
    }, false);
    
    mammoth.fileInput(
        uploadElement,
        function(result) {
            latestResult = result;
            if (result.error) {
                showError(result.error);
            } else {
                showResult(result);
            }
        }
    );
    
    function showError(error) {
        if (error.message) {
            error = error.message;
        }
        parentElement.className = "status-error";
        document.getElementById("mammoth-docx-error-message").innerHTML = escapeHtml(error);
    }
    
    function showResult(result) {
        parentElement.className = "status-loaded";
        
        showPreview(result.value);
        showMessages(result.messages);
    }
    
    function showPreview(value) {
        document.getElementById("mammoth-docx-raw-preview").innerHTML = escapeHtml(value);
        
        var visualPreviewDocument = document.getElementById("mammoth-docx-visual-preview").contentDocument;
        visualPreviewDocument.body.innerHTML = value;
    }
    
    function showMessages(messages) {
        if (messages.length) {
            var messageElements = messages.map(function(message) {
                return "<li>" + capitalise(message.type) + ": " + escapeHtml(message.message) + "</li>";
            }).join("");
            
            document.getElementById("mammoth-docx-messages").innerHTML =
                "<ul>" + messageElements + "</ul>";
        } else {
            document.getElementById("mammoth-docx-messages").innerHTML =
                "<p>No messages.</p>";
        }
    }
    
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
    
    function capitalise(string) {
        return string.charAt(0).toUpperCase() + string.substring(1);
    }
})();
