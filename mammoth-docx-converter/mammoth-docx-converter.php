<?php
/*
Plugin Name: Mammoth .docx converter
Plugin URI: https://github.com/mwilliamson/mammoth-wordpress-plugin
Description: Mammoth converts semantically marked up .docx documents to simple and clean HTML.
Version: 1.3.0
Author: Michael Williamson
Author URI: http://mike.zwobble.org/
License: BSD 2-clause
*/

add_action( 'add_meta_boxes', 'mammoth_add_post_meta_box' );
add_action( 'admin_footer', 'mammoth_load_javascript' );
add_action( 'admin_enqueue_scripts', 'mammoth_admin_style' );


function mammoth_add_post_meta_box() {
    $post_types = get_post_types();
    
    foreach ($post_types as $post_type) {
        if (post_type_supports($post_type, 'editor')) {
            add_meta_box(
                'mammoth_add_post',
                __( 'Mammoth .docx converter' ),
                'mammoth_render_editor_box',
                $post_type
            );
        }
    }
}

function mammoth_admin_style() {
    wp_enqueue_style( 'mammoth-style', plugins_url( 'mammoth-docx-converter/mammoth.css' ), array(), "1.3.0" );
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

        <div id="mammoth-docx-inserting">
            Inserting...
        </div>

        <p class="mammoth-docx-error">
            Error while attempting to convert file:
            <span id="mammoth-docx-error-message"></span>
        </p>
    
        <div class="mammoth-docx-preview">
            <input type="hidden"
                id="mammoth-docx-upload-image-nonce"
                value="<?php echo wp_create_nonce( "media-form" ); ?>"
                />
            <input type="hidden"
                id="mammoth-docx-upload-image-href"
                value="<?php echo get_site_url( null, "wp-admin/async-upload.php", "admin" ); ?>"
                />
            <input type="hidden"
                id="mammoth-docx-admin-ajax-href"
                value="<?php echo get_site_url( null, "wp-admin/admin-ajax.php", "admin" ); ?>"
                />
            
            <p><input type="button" id="mammoth-docx-insert" value="Insert into editor" /></p>
            <div class="mammoth-tabs">
                <div class="tab">
                    <h4>Visual</h4>
                    <iframe
                        id="mammoth-docx-visual-preview"
                        src="<?php echo plugins_url( 'mammoth-docx-converter/visual-preview.html' ); ?>"
                        data-stylesheets="<?php echo mammoth_editor_stylesheets_list(); ?>">
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
    mammoth_load_script( 'mammoth-editor' );
    mammoth_load_script( 'tabs' );
}

function mammoth_load_script( $name ) {
    $url = plugins_url( 'mammoth-docx-converter/' . $name . '.js' );
    echo '<script src="'. $url . '?v=1.3.0"></script>';
}

function mammoth_editor_stylesheets_list( ) {
    global $editor_styles;
    $editor_styles = (array) $editor_styles;
    
    // Taken from class-wp-editor.php
    if ( ! empty( $editor_styles ) && is_array( $editor_styles ) ) {
        $mce_css = array();
        $editor_styles = array_unique($editor_styles);
        $style_uri = get_stylesheet_directory_uri();
        $style_dir = get_stylesheet_directory();

        if ( is_child_theme() ) {
            $template_uri = get_template_directory_uri();
            $template_dir = get_template_directory();

            foreach ( $editor_styles as $key => $file ) {
                if ( $file && file_exists( "$template_dir/$file" ) )
                    $mce_css[] = "$template_uri/$file";
            }
        }

        foreach ( $editor_styles as $file ) {
            if ( $file && file_exists( "$style_dir/$file" ) )
                $mce_css[] = "$style_uri/$file";
        }

        return implode( ',', $mce_css );
    } else {
        return 'visual-preview.css';
    }
}
