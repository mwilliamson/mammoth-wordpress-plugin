<?php
/*
Plugin Name: Custom Mammoth options
Version: 1.0.0
Author: Michael Williamson
Author URI: http://mike.zwobble.org/
License: BSD 2-clause
*/

add_action( 'admin_footer', 'mammoth_options_load_javascript' );


function mammoth_options_load_javascript() {
    mammoth_options_load_script( 'mammoth-options' );
}

function mammoth_options_load_script( $name ) {
    $url = plugins_url( 'mammoth-options/' . $name . '.js' );
    echo '<script src="'. $url . '?v=1.0.0"></script>';
}
