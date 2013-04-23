(function() {
    var uploadElement = document.getElementById("mammoth-docx-upload");
    var loadingElement = document.getElementById("mammoth-docx-loading");
    
    uploadElement.addEventListener('change', function() {
        loadingElement.style.display = "block";
    }, false);
    
    mammoth.fileInput(
        uploadElement,
        function(result) {
            loadingElement.style.display = "none";
            document.getElementById("mammoth-docx-raw-preview").innerHTML = escapeHtml(result.value);
        }
    );

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
})();
