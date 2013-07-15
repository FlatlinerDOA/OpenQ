module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    grunt.registerTask('tests', 'Runs all unit tests in the given folder', function () {
        grunt.task.requires('typescript:base');
        grunt.log.writeln('TODO... get tests to run...');
    });

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
        typescript: {
            base: {
                src: ['**/*.ts'],
                options: {
                    module: 'requirejs',
                    target: 'es5'
                }
            }
        },
        tests: {
            path: 'spec'
        },
        watch: {
            files: '**/*.ts',
            tasks: ['typescript','tests']
        },
        open: {
            dev: {
                path: 'http://localhost:8000/index.html'
            }
        }
    });

       grunt.registerTask('default', ['typescript:base', 'watch']);
}