# This script will run all of the functional tests for each functional test file in sequence
# This prevents mocha from running out of memory when running all of the tests
#
# This could potentially be improved to run the tests in parallel
from pathlib import Path
import os
import sys
import subprocess

# There should be a root mocha file which is the output of the tests
original_mocha_file = os.getenv("MOCHA_FILE")
mocha_file = original_mocha_file or "./test-results.xml"
mocha_base_file, mocha_file_ext = os.path.splitext(mocha_file)

# Iterate with a glob that matches the value in the mocha.functional.json
path = Path(".")
files = path.glob("./out/test/**/*.functional.test.js")
index = 0
returncode = 0
for f in files:
    # Each file will generate a $MOCHA_FILE output file. Change each to match an index
    # Note: this index is used as a pattern when setting mocha file in the test_phases.yml
    index += 1
    sub_mocha_file = mocha_base_file + str(index) + mocha_file_ext
    os.environ["MOCHA_FILE"] = sub_mocha_file

    # run the test using just this file
    with subprocess.Popen(
        [
            "node",
            "./node_modules/mocha/bin/_mocha",
            str(f),
            "--require=out/test/unittests.js",
            "--exclude=out/**/*.jsx",
            "--reporter=mocha-multi-reporters",
            "--reporter-option=configFile=build/.mocha-multi-reporters.config",
            "--ui=tdd",
            "--recursive",
            "--grep",
            "Simple text",
            "--colors",
            "--exit",
            "--timeout=180000",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    ) as sub_proc:
        # Poll for output
        while sub_proc.poll() is None:
            stdout_output = sub_proc.stdout.readline()
            if stdout_output:
                sys.stdout.write(stdout_output.decode("utf-8"))
                sys.stdout.flush()

        result = sub_proc.poll()

        # Keep track if anybody failed (but don't exit yet)
        if result != 0:
            print("Functional tests for {0} failed.", str(f))
            returncode = result

    # Concat the temp mocha file onto the original
    with open(mocha_file, "w") as outfile:
        with open(sub_mocha_file) as readfile:
            outfile.write(readfile.read())

# Reset the mocha file variable
if original_mocha_file:
    os.environ["MOCHA_FILE"] = original_mocha_file

# Respond with final return code
exit(returncode)

