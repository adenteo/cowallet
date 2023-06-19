# CoWallet Installation

This guide will walk you through the process of cloning the CoWallet repository and installing the required Node modules using `npm`.

## Prerequisites

Before proceeding, make sure you have the following prerequisites installed on your system:

-   [Git](https://git-scm.com/)
-   [Node.js](https://nodejs.org/) (which includes `npm`)(Tested and working version: `v18.16.0`)

## Clone the Repository

To clone the repository to your local machine, follow these steps:

1. Open your terminal or command prompt.
2. Navigate to the directory where you want to clone the repository.
3. Run the following command to clone the repository: `gh repo clone Algo-Foundry/multisig-adenteo`. Alternatively, you can download the folder as a `.zip` and extract it to your desired location.

## Install Required Node Modules

To install the required Node modules for the project, use `npm`. Follow these steps:

1. Open your terminal or command prompt.
2. Navigate to the repository's directory. Use the `cd` command to change directories.
3. Run the following command to install the Node modules specified in the project's `package.json` file: `npm install`
4. Wait for the installation process to complete. `npm` will download and install all the required dependencies.

## Set-up environment variables

1. Rename `.env.local.example` to `.env.local` to specify the networks of your local Algorand Nodes.

## Conclusion

Once you have successfully cloned the repository and installed the required Node modules, you are ready to view the CoWallet application!

Use `npm run dev` to launch the application on your local machine. In order to use the features, please refer to the user guide.

If you encounter any issues or have questions, please refer to the repository's documentation or seek assistance from the project maintainers.
