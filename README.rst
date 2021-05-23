========================
Commitlint Github Action
========================

This project is a github `action <https://github.com/features/actions>`_ to run
`commitlint <https://commitlint.js.org/>`_.

If it's run as a result of a pull request, it lints all the commits from the
pull request (up to 250). If it's run as the result of a push, it lints all the
commits in that branch. Otherwise, it lints all the commits on the default
branch.
