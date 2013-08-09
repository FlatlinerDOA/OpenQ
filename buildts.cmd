@echo off
where ".;.\spec;.\loadtests:*.ts" > ts.txt
tsc @ts.txt -removeComments --module commonjs