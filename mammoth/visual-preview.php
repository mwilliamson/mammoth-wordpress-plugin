<!DOCTYPE html>
<html>
    <head>
        <?php
            require_once( './admin.php' );
            global $editor_styles;
            $editor_styles = (array) $editor_styles;
            foreach ( $editor_styles as $editor_style ) {
                echo '<link rel="stylesheet" type="text/css" href="' . $editor_style . '" />';
            }
        ?>
    </head>
    <body>
    </body>
</html>
