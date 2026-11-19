(function() {
    var nextId = 0;

    Array.prototype.forEach.call(document.getElementsByClassName("mammoth-tabs"), function(tabsElement) {
        var headings = Array.prototype.map.call(tabsElement.getElementsByClassName("tab"), function(tabElement) {
            var titleElement = tabElement.children[0];
            var title = titleElement.textContent;
            tabElement.removeChild(titleElement);

            var id = nextId++;
            var tabId = "mammoth-tab-" + id;
            var panelId = "mammoth-tabpanel-" + id;

            var element = document.createElement("li");
            element.setAttribute("role", "presentation");

            var button = document.createElement("button");
            button.type = "button";
            button.id = tabId;
            button.textContent = title;
            button.setAttribute("role", "tab");
            button.setAttribute("aria-controls", panelId);
            button.addEventListener("click", select, false);
            element.appendChild(button);

            tabElement.id = panelId;
            tabElement.setAttribute("role", "tabpanel");
            tabElement.setAttribute("aria-labelledby", tabId);
            tabElement.setAttribute("tabindex", "0");

            function select() {
                headings.forEach(function(heading) {
                    heading.deselect();
                });
                element.className = "selected";
                button.setAttribute("aria-selected", "true");
                button.removeAttribute("tabindex");
                tabElement.style.display = "block";
            }

            function deselect() {
                element.className = "";
                button.setAttribute("aria-selected", "false");
                button.setAttribute("tabindex", "-1");
                tabElement.style.display = "none";
            }

            return {
                element: element,
                button: button,
                select: select,
                deselect: deselect
            };
        });

        var headingsElement = document.createElement("ul");
        headingsElement.className = "tabs-nav";
        headingsElement.setAttribute("role", "tablist");
        headingsElement.setAttribute("aria-label", "Preview");
        headings.forEach(function(heading) {
            headingsElement.appendChild(heading.element);
        });

        // Arrow keys, Home and End move between tabs and select the one
        // they land on, as in the ARIA Authoring Practices tabs pattern.
        headingsElement.addEventListener("keydown", function(event) {
            var current = -1;
            headings.forEach(function(heading, index) {
                if (heading.button === event.target) {
                    current = index;
                }
            });
            if (current === -1) {
                return;
            }
            var target;
            switch (event.key) {
                case "ArrowRight":
                    target = (current + 1) % headings.length;
                    break;
                case "ArrowLeft":
                    target = (current - 1 + headings.length) % headings.length;
                    break;
                case "Home":
                    target = 0;
                    break;
                case "End":
                    target = headings.length - 1;
                    break;
                default:
                    return;
            }
            event.preventDefault();
            headings[target].select();
            headings[target].button.focus();
        }, false);

        tabsElement.insertBefore(headingsElement, tabsElement.firstChild);
        headings[0].select();
    });
})();
