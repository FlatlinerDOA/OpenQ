@echo off
where ".;.\spec;.\loadtests;.\types:*.ts" > ts.txt
tsc @ts.txt -removeComments --module commonjs