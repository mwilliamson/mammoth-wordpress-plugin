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
                mammoth.convertDocumentToHtml(documentResult, mammoth.standardOptions, function(result) {
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
        var options = Object.create(mammoth.standardOptions);
        options.convertImage = function(element, html, messages, callback) {
            element.read("binary").then(function(imageBinaryString) {
                var formData = new PolyfillFormData();
                var filename = "word-image.png";
                formData.append("name", filename);
                formData.append("action", "upload-attachment");
                formData.append("post_id", document.getElementById("post_ID").value);
                // TODO: generate nonce
                formData.append("_wpnonce", "1613df2ed7");
                formData.appendFile("async-upload", {
                    binary: imageBinaryString,
                    contentType: element.contentType,
                    filename: filename
                });
                // TODO: don't assume WordPress is at the root
                jQuery.ajax({
                    url: "/wp-admin/async-upload.php",
                    type: "POST",
                    data: formData.body(),
                    processData: false,
                    contentType: 'multipart/form-data; boundary=' + formData.boundary,
                    success: function(uploadResult) {
                        // TODO: include correct src
                        html.selfClosing(mammoth.htmlPaths.element("img", {alt: element.altText, src: "!!!"}));
                        callback();
                    },
                    failure: function() {
                        // TODO: record error
                        callback();
                    }
                });
            }).done();
        };
        
        mammoth.convertDocumentToHtml(latestDocumentResult, options, function(result) {
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
    
    function toArrayBuffer(buffer) {
        var arrayBuffer = new ArrayBuffer(buffer.length);
        var view = new Uint8Array(arrayBuffer);
        for (var i = 0; i < buffer.length; ++i) {
            view[i] = buffer.readUInt8(i);
        }
        return arrayBuffer;
    }
    
    function PolyfillFormData() {
        this.boundary = "-----------------------------" + Math.floor(Math.random() * 0x100000000);
        this._fields = [];
        this._files = [];
    }
    
    PolyfillFormData.prototype.append = function(key, value) {
        this._fields.push({key: key, value: value});
    };
    
    PolyfillFormData.prototype.appendFile = function(key, file) {
        this._files.push({key: key, file: file});
    };
    
    PolyfillFormData.prototype.body = function() {
        var boundary = this.boundary;
        var body = "\r\n";
        this._fields.forEach(function(field) {
            body += "--" + boundary + "\r\n";
            body += "Content-Disposition: form-data; name=\"" + field.key + "\"\r\n\r\n";
            body += field.value + "\r\n";
        });
        this._files.forEach(function(field) {
            body += "--" + boundary + "\r\n";
            body += 'Content-Disposition: form-data; name="' + field.key + '"; filename="' + field.file.filename + '"\r\n';
            if (field.file.contentType) {
                body += "Content-Type: " + field.file.contentType + "\r\n\r\n";
            }
            body += field.file.binary + "\r\n";
        });
        body += "--" + boundary +"--\r\n";
        
        var nBytes = body.length
        var ui8Data = new Uint8Array(nBytes);
        for (var nIdx = 0; nIdx < nBytes; nIdx++) {
            ui8Data[nIdx] = body.charCodeAt(nIdx) & 0xff;
        }
        return ui8Data;
    };
    
})();

