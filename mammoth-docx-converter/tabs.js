(function() {
    Array.prototype.forEach.call(document.getElementsByClassName("mammoth-tabs"), function(tabsElement) {
        var headings = Array.prototype.map.call(tabsElement.getElementsByClassName("tab"), function(tabElement) {
            var titleElement = tabElement.children[0];
            var title = titleElement.textContent;
            tabElement.removeChild(titleElement);
            var element = document.createElement("li");
            element.textContent = title;
            element.addEventListener("click", select, false);
            
            function select() {
                headings.forEach(function(heading) {
                    heading.deselect();
                });
                element.className = "selected";
                tabElement.style.display = "block";
            }
            
            function deselect() {
                element.className = "";
                tabElement.style.display = "none";
            }
            
            return {
                element: element,
                select: select,
                deselect: deselect
            };
        });
        
        var headingsElement = document.createElement("ul");
        headingsElement.className = "tabs-nav";
        headings.forEach(function(heading) {
            headingsElement.appendChild(heading.element);
        });
        tabsElement.insertBefore(headingsElement, tabsElement.firstChild);
        headings[0].select();
    });
})();
