(function() {
    mammoth.fileInput(
        document.getElementById("mammoth-docx-upload"),
        function(result) {
            document.getElementById("mammoth-docx-loading").style.display = "none";
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
