(function() {
    var latestResult = null;
    var latestDocumentResult = null;
    var uploadElement = document.getElementById("mammoth-docx-upload");
    var parentElement = document.getElementById("mammoth-docx-uploader");
    var visualPreviewElement = document.getElementById("mammoth-docx-visual-preview");
    
    uploadElement.addEventListener('change', function() {
        parentElement.className = "status-loading";
    }, false);
    
    mammoth.readFileInputOnChange(
        uploadElement,
        function(documentResult) {
            latestDocumentResult = documentResult;
            if (latestDocumentResult.error) {
                showError(result.error);
            } else {
                mammoth.convertDocumentToHtml(documentResult, function(result) {
                    latestResult = result;
                    if (result.error) {
                        showError(result.error);
                    } else {
                        showResult(result);
                    }
                });
            }
        }
    );
    
    document.getElementById("mammoth-docx-insert")
        .addEventListener("click", insertIntoEditor, false);
    
    function insertIntoEditor() {
        mammoth.convertDocumentToHtml(latestDocumentResult, function(result) {
            if (result.error) {
                showError(result.error);
            } else {
                insertTextIntoEditor(result.value);
            }
        });
    }
    
    function insertTextIntoEditor(text) {
        if(!tinyMCE.activeEditor || tinyMCE.activeEditor.isHidden()) {
            insertText(document.getElementById("content"), text);
        } else {
            tinyMCE.execCommand('mceInsertRawHTML', false, text);
        }
    }
    
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
        var visualPreviewDocument = visualPreviewElement.contentDocument;
        setUpVisualPreviewStylesheets();
        visualPreviewDocument.body.innerHTML = value;
        document.getElementById("mammoth-docx-raw-preview").innerHTML = escapeHtml(value);
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
    
    var visualStylesheetsAlreadySetUp = false;
    function setUpVisualPreviewStylesheets() {
        if (visualStylesheetsAlreadySetUp) {
            return;
        }
        visualStylesheetsAlreadySetUp = true;
        var visualPreviewDocument = visualPreviewElement.contentDocument;
        var stylesheets = visualPreviewElement.getAttribute("data-stylesheets").split(",");
        stylesheets.forEach(function(stylesheet) {
            var element = document.createElement("link");
            element.rel = "stylesheet";
            element.type = "text/css";
            element.href = stylesheet;
            visualPreviewDocument.head.appendChild(element);
        });
    }
})();
