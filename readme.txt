=== Mammoth .docx converter ===
Contributors: michaelwilliamson
Tags: docx, html, word, office
Requires at least: 3.5
Tested up to: 3.9
Stable tag: 0.1.5
License: BSD 2-clause
License URI: http://opensource.org/licenses/BSD-2-Clause

Mammoth converts semantically marked up .docx documents to simple and clean HTML.

== Description ==

Mammoth is designed to convert .docx documents,
such as those created by Microsoft Word,
and convert them to HTML.
Mammoth aims to produce simple and clean HTML by using semantic information in the document,
and ignoring other details.
For instance,
Mammoth converts any paragraph with the style `Heading1` to `h1` elements,
rather than attempting to exactly copy the styling (font, text size, colour, etc.) of the heading.

There's a large mismatch between the structure used by .docx and the structure of HTML,
meaning that the conversion is unlikely to be perfect for more complicated documents.
Mammoth works best if you only use styles to semantically mark up your document.

== Installation ==

Install the plugin in the usual way,
and you should be able to use the Mammoth .docx converter when adding a post.
If you can't see the meta box,
make sure that it's selected by taking a look at the "Screen Options" for adding a post.

== Changelog ==

= 0.1.6 =

* Update to mammoth 0.2.2

* Pretty print HTML output

= 0.1.5 =

* Fix versions

= 0.1.4 =

* Fix readme.txt

= 0.1.3 =

* Update to the latest version of mammoth (0.2.1)

= 0.1 =

* Initial release
