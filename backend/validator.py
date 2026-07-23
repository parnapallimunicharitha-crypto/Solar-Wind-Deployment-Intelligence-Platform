"""
Root wrapper for validator module.
Executes Site Assessment Engine automated test suite.
"""

from app.services.validator import ValidationRunner, run_validation

if __name__ == "__main__":
    run_validation()
