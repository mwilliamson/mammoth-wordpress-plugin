var mammoth = require("mammoth");

var parentElement = document.getElementById("mammoth-docx-uploader");
if (parentElement) {
    setUpMammoth();
}

function setUpMammoth() {
    var latestDocumentArrayBuffer = null;
    var uploadElement = document.getElementById("mammoth-docx-upload");
    var visualPreviewElement = document.getElementById("mammoth-docx-visual-preview");
    
    uploadElement.addEventListener('change', function(event) {
        parentElement.className = "status-loading";
        handleFileSelect(event);
    }, false);
    
    function convertToHtml(input, options) {
        var fullOptions = {prettyPrint: true};
        for (var key in options) {
            fullOptions[key] = options[key];
        }
        return mammoth.convertToHtml(input, fullOptions);
    }
    
    function handleFileSelect(event) {
        readFileInputEventAsArrayBuffer(event, function(arrayBuffer) {
            latestDocumentArrayBuffer = arrayBuffer;
            convertToHtml({arrayBuffer: arrayBuffer})
                .then(function(result) {
                    showResult(result);
                })
                .then(null, showError);
        });
    }
    
    function readFileInputEventAsArrayBuffer(event, callback) {
        var file = event.target.files[0];

        var reader = new FileReader();
        
        reader.onload = function(loadEvent) {
            var arrayBuffer = loadEvent.target.result;
            callback(arrayBuffer);
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    document.getElementById("mammoth-docx-insert")
        .addEventListener("click", insertIntoEditor, false);
    
    function insertIntoEditor() {
        var postId = document.getElementById("post_ID").value;
        var options = {
            convertImage: mammoth.images.inline(function(element) {
                return element.read("binary").then(function(imageBinaryString) {
                    var filename = "word-image.png";
                    return uploadImage({
                        filename: filename,
                        contentType: element.contentType,
                        binary: imageBinaryString
                    });
                }).then(function(uploadResult) {
                    if (element.altText) {
                        setImageAltText({
                            id: uploadResult.data.id,
                            alt: element.altText,
                            nonce: uploadResult.data.nonces.update
                        });
                    }
                    return {
                        src: uploadResult.data.url,
                        "class": "wp-image-" + uploadResult.data.id
                    };
                });
            }),
            idPrefix: "post-" + postId + "-"
        };
        parentElement.classList.add("status-inserting");
        convertToHtml({arrayBuffer: latestDocumentArrayBuffer}, options)
            .then(function(result) {
                insertTextIntoEditor(result.value);
                showMessages(result.messages);
                parentElement.classList.remove("status-inserting");
            }, showError);
    }
    
    function uploadImage(options) {
        var filename = options.filename;
        var contentType = options.contentType;
        var imageBinaryString = options.binary;
        var formData = new PolyfillFormData();
        formData.append("name", filename);
        formData.append("action", "upload-attachment");
        formData.append("post_id", document.getElementById("post_ID").value);
        var nonce = document.getElementById("mammoth-docx-upload-image-nonce").value;
        formData.append("_wpnonce", nonce);
        formData.appendFile("async-upload", {
            binary: imageBinaryString,
            contentType: contentType,
            filename: filename
        });
        return jQuery.ajax({
            url: document.getElementById("mammoth-docx-upload-image-href").value,
            type: "POST",
            data: formData.body(),
            processData: false,
            contentType: 'multipart/form-data; boundary=' + formData.boundary,
            dataType: "json"
        }).then(null, function(value) {
            var deferred = jQuery.Deferred();
            deferred.reject(new Error("Image upload HTTP request failed: " + value.statusText));
            return deferred.promise();
        });
    }

    function setImageAltText(options) {
        return jQuery.ajax({
            url: document.getElementById("mammoth-docx-admin-ajax-href").value,
            type: "POST",
            data: {
                "action": "save-attachment",
                "changes[alt]": options.alt,
                "id": options.id,
                "post_id": 0,
                "nonce": options.nonce
            }
        })
    }

    function insertTextIntoEditor(text) {
        var elementId = "content";
        // The ckeditor-for-wordpress plugin shims tinyMCE in such a way
        // that if we checked for tinyMCE first, we'd detect it as
        // active, but the command to insert HTML would fail.
        // Therefore, we check for CKEditor first
        if (window.CKEDITOR && CKEDITOR.instances[elementId]) {
            CKEDITOR.instances[elementId].insertHtml(text);
        } else if (window.tinyMCE && tinyMCE.get(elementId) && !tinyMCE.get(elementId).isHidden()) {
            tinyMCE.get(elementId).execCommand('mceInsertRawHTML', false, text);
        } else {
            insertText(document.getElementById(elementId), text);
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
        // TODO: Test image replacement
        // TODO: Use a less hack-tastic method of replacing images,
        // such as rendering the HTML twice, once with images, once without
        var htmlWithoutImageData = value.replace(/(<img\s[^>]*)src="data:[^"]*"([^>]* \/>)/g, '$1src="path/to/image"$2');
        document.getElementById("mammoth-docx-raw-preview").innerHTML = escapeHtml(htmlWithoutImageData);
    }
    
    function showMessages(messages) {
        if (messages.length) {
            var messageElements = messages
                .filter(function(message) {
                    return message.message;
                })
                .map(function(message) {
                    return "<li>" + capitalise(message.type) + ": " + escapeHtml(message.message) + "</li>";
                })
                .join("");
            
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
    
};

