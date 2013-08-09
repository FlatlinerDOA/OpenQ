@echo off
where ".;.\spec;.\loadtests:*.ts" > ts.txt
echo Watching...
tsc @ts.txt -removeComments --module commonjs -sourcemap -w 