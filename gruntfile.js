var child_process = require('child_process');
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    grunt.registerTask('tests', 'Spawns a child process that runs jasmine-node specs', function (args) {
        var done = this.async();
        var testProc = child_process.fork('tests.js');
        testProc.on('exit', function() {
            grunt.log.writeln('Tests done!');
            testProc = null;
            done();
        });
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
        open: {
            dev: {
                path: 'http://localhost:8000/index.html'
            }
        },
        watch: {
            files: '**/*.ts',
            tasks: ['ts:root', 'ts:spec', 'tests']
        }
    });

       grunt.registerTask('default', ['ts:root', 'tests', 'watch']);
}