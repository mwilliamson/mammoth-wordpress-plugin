(function() {
    var rawHtml = "";
    var uploadElement = document.getElementById("mammoth-docx-upload");
    var loadingElement = document.getElementById("mammoth-docx-loading");
    
    uploadElement.addEventListener('change', function() {
        loadingElement.style.display = "block";
    }, false);
    
    mammoth.fileInput(
        uploadElement,
        function(result) {
            loadingElement.style.display = "none";
            rawHtml = escapeHtml(result.value);
            document.getElementById("mammoth-docx-raw-preview").innerHTML = rawHtml;
        }
    );
    
    document.getElementById("mammoth-docx-insert").addEventListener("click", function() {
        if(!tinyMCE.activeEditor || tinyMCE.activeEditor.isHidden()) {
            document.getElementById("content").value = rawHtml;
        } else {
            tinyMCE.execCommand('mceInsertRawHTML', false, rawHtml);
        }
    }, false);

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
})();
