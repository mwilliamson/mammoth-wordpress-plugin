<?php
/*
Plugin Name: Mammoth
Plugin URI: https://github.com/mwilliamson/mammoth-wordpress-plugin
Author: Michael Williamson
Author URI: http://mike.zwobble.org/
License: BSD 2-clause
*/

add_action( 'add_meta_boxes', 'mammoth_add_post_meta_box' );

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
}
