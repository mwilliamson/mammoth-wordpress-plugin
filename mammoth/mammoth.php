<?php
/*
Plugin Name: Mammoth
Plugin URI: https://github.com/mwilliamson/mammoth-wordpress-plugin
Author: Michael Williamson
Author URI: http://mike.zwobble.org/
License: BSD 2-clause
*/

add_action( 'add_meta_boxes', 'mammoth_add_post_meta_box' );
add_action( 'admin_footer', 'mammoth_load_javascript' );


function mammoth_add_post_meta_box() {
    $screens = array( 'post', 'page' );
    foreach ($screens as $screen) {
        add_meta_box(
            'mammoth_add_post',
            __( 'Mammoth' ),
            'mammoth_render_editor_box',
            $screen
        );
    }
}


function mammoth_render_editor_box( $post ) {
    echo '<label>Select docx file:';
    echo '<input type="file" id="mammoth-docx-upload" />';
    echo '</label>';
    echo '<div id="mammoth-docx-loading">';
    echo 'Loading...';
    echo '</div>';
    echo '<h4>Raw HTML</h4>';
    echo '<pre id="mammoth-docx-raw-preview">';
    echo '</pre>';
}


function mammoth_load_javascript() {
    $url = plugins_url( 'mammoth/mammoth.js' );
    echo '"<script src="'. $url . '"></script>"';

    $url = plugins_url( 'mammoth/mammoth-editor.js' );
    echo '"<script src="'. $url . '"></script>"';
}
