var mammoth = require("mammoth");
var slug = require("./slug");

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
        if (typeof MAMMOTH_OPTIONS !== "undefined") {
            var customOptions = typeof MAMMOTH_OPTIONS === "function" ? MAMMOTH_OPTIONS(mammoth) : MAMMOTH_OPTIONS;

            for (var key in customOptions) {
                fullOptions[key] = customOptions[key];
            }
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
        var lastImageNumber = 0;
        var options = {
            convertImage: mammoth.images.inline(function(element) {
                var imageNumber = ++lastImageNumber;
                return element.readAsArrayBuffer().then(function(imageArrayBuffer) {
                    var filename = generateFilename(element, {postId: postId, imageNumber: imageNumber});
                    return uploadImage({
                        filename: filename,
                        contentType: element.contentType,
                        arrayBuffer: imageArrayBuffer
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
            })
            .then(null, showError);
    }

    var slugCharmap = jQuery.extend({}, slug.charmap, {".": "-", "\\": "-", "/": "-"});
    var slugOptions = {
        mode: "rfc3986",
        charmap: slugCharmap
    };

    function generateFilename(element, options) {
        var name = element.altText ? slug(element.altText.slice(0, 50), slugOptions) : "word-image-" + options.postId + "-" + options.imageNumber;
        var extension = element.contentType.split("/")[1];
        return name + "." + extension;
    }

    function uploadImage(options) {
        var filename = options.filename;
        var contentType = options.contentType;
        var imageArrayBuffer = options.arrayBuffer;
        var formData = new FormData();
        formData.append("name", filename);
        formData.append("action", "upload-attachment");
        formData.append("post_id", document.getElementById("post_ID").value);
        var nonce = document.getElementById("mammoth-docx-upload-image-nonce").value;
        formData.append("_wpnonce", nonce);
        var imageBlob = new Blob([imageArrayBuffer], {type: contentType});
        formData.append("async-upload", imageBlob, filename);
        return fetch(document.getElementById("mammoth-docx-upload-image-href").value, {
            method: "POST",
            body: formData,
            dataType: "json"
        }).then(function(response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(response.statusText);
            }
        }).then(function(uploadResult) {
            if (uploadResult.success !== false) {
                return uploadResult;
            } else {
                return rejectImage(uploadResult.data.message);
            }
        }, function(error) {
            return rejectImage(error.toString());
        });
    }

    function rejectImage(message) {
        return reject(new Error("Image upload HTTP request failed: " + message));
    }

    function reject(error) {
        var deferred = jQuery.Deferred();
        deferred.reject(error);
        return deferred.promise();
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
        } else if (document.body.classList.contains("block-editor-page")) {
            // Inspecting the class list is the suggested way of detecting whether
            // Gutenberg is active, from the GitHub issue:
            //     https://github.com/WordPress/gutenberg/issues/12200
            // This code previously checked if wp.blocks was defined, but this
            // seems to be unreliable when some plugins are installed, such as
            // Yoast.
            var block = wp.blocks.createBlock("core/freeform", {content: text});
            wp.data.dispatch("core/editor").insertBlocks(block);
        } else if (window.tinyMCE && tinyMCE.get(elementId) && !tinyMCE.get(elementId).isHidden()) {
            // This reimplements mceInsertRawHTML due to a bug in tinyMCE:
            // https://github.com/tinymce/tinymce/issues/4401
            var editor = tinyMCE.get(elementId);
            var placeholder = "tiny_mce_marker_" + Math.random().toString().replace(/\./g, "");
            editor.selection.setContent(placeholder);
            editor.setContent(editor.getContent().replace(new RegExp(placeholder, "g"), function() {
                return text;
            }));
        } else {
            insertText(document.getElementById(elementId), text);
        }
    }

    function showError(error) {
        console.error(error);
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
        visualPreviewDocument.body.style.backgroundColor = "white";
        var stylesheets = visualPreviewElement.getAttribute("data-stylesheets").split(",");
        stylesheets.forEach(function(stylesheet) {
            var element = document.createElement("link");
            element.rel = "stylesheet";
            element.type = "text/css";
            element.href = stylesheet;
            visualPreviewDocument.head.appendChild(element);
        });
    }
};

