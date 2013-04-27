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
add_action( 'admin_enqueue_scripts', 'mammoth_admin_style' );


function mammoth_add_post_meta_box() {
    $screens = array( 'post', 'page' );
    foreach ($screens as $screen) {
        add_meta_box(
            'mammoth_add_post',
            __( 'Mammoth .docx converter' ),
            'mammoth_render_editor_box',
            $screen
        );
    }
}

function mammoth_admin_style() {
    wp_enqueue_style( 'mammoth-style', plugins_url( 'mammoth/mammoth.css' ) );
}


function mammoth_render_editor_box( $post ) {
    ?>
    <div id="mammoth-docx-uploader" class="status-empty">
        <div>
            <label>
                Select docx file:
                <input type="file" id="mammoth-docx-upload" />
            </label>
        </div>
    
        <div id="mammoth-docx-loading">
            Loading...
        </div>
    
        <div class="mammoth-docx-preview">
            <p><input type="button" id="mammoth-docx-insert" value="Insert" /></p>
            <div class="mammoth-tabs">
                <div class="tab">
                    <h4>Visual</h4>
                    <iframe id="mammoth-docx-visual-preview" src="<?php echo plugins_url( 'mammoth/visual-preview.html' ); ?>">
                    </iframe>
                </div>
                <div class="tab">
                    <h4>Raw HTML</h4>
                    <pre id="mammoth-docx-raw-preview">
                    </pre>
                </div>
                <div class="tab">
                    <h4>Messages</h4>
                    <div id="mammoth-docx-messages">
                    </div>
                </div>
            </div>
        </div>
    
    </div>
<?php
}


function mammoth_load_javascript() {
    mammoth_load_script( 'mammoth' );
    mammoth_load_script( 'mammoth-editor' );
    mammoth_load_script( 'tabs' );
}

function mammoth_load_script( $name ) {
    $url = plugins_url( 'mammoth/' . $name . '.js' );
    echo '"<script src="'. $url . '"></script>"';
}
