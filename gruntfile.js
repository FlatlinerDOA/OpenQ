module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 8000,
                    base: './'
                }
            }
        },
        ts: {
            options: {                    // use to override the default options, See : http://gruntjs.com/configuring-tasks#options
                target: 'es5',            // es3 (default) / or es5
                module: 'commonjs',       // amd , commonjs (default)
                sourcemap: true,          // true  (default) | false
                declaration: false,       // true | false  (default)
                nolib: false,             // true | false (default)
                comments: false           // true | false (default)
            },
            root: {
                src: ['*.ts']
            },
            spec: {
                src: ['spec/*.ts']
            },
            loadtests: {
                src: ['loadtests/*.ts']
            }
        },
        watch: {
            files: '**/*.ts',
            tasks: ['ts:root','ts:spec']
        },
        open: {
            dev: {
                path: 'http://localhost:8000/index.html'
            }
        }
    });

       grunt.registerTask('default', ['ts:root', 'watch']);
}