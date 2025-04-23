import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from 'bs58'
import * as prompt from 'prompt-sync'
import * as fs from 'fs'

const input = prompt.default()

function displayMenu() {
    console.log("\nSolana Wallet Tool");
    console.log("1. Generate new keypair");
    console.log("2. Decode keypair file to base58");
    console.log("3. Convert base58 to keypair JSON");
    console.log("4. View dev wallet");
    console.log("5. View Turbin3 wallet");
    console.log("6. Create Keypair from Binary");
    console.log("7. Exit");
    return input("Select an option (1-5): ");
}

function createKeypairFromBinary() {
    const binaryKey = input("\nEnter binary secret key: ")

    const binaryKeyArray = JSON.parse(binaryKey)
    const secretKey = new Uint8Array(binaryKeyArray)
    const kp = Keypair.fromSecretKey(secretKey)
    const walletFile = {
        privateKey: Array.from(secretKey),
        publicKey: kp.publicKey.toBase58()
    }
    
    fs.writeFileSync('./Turbin3-wallet.json', JSON.stringify(walletFile, null, 2))
    console.log(`\nWallet converted and saved!`)
    console.log(`Public Key: ${kp.publicKey.toBase58()}`)
}

function generateNewKeypair() {
    const kp = Keypair.generate()
    const walletFile = {
        privateKey: Array.from(kp.secretKey),
        publicKey: kp.publicKey.toBase58()
    }
    
    fs.writeFileSync('./dev-wallet-new.json', JSON.stringify(walletFile, null, 2))
    console.log(`\nNew Solana wallet generated!`)
    console.log(`Public Key: ${kp.publicKey.toBase58()}`)
    console.log(`Wallet saved to ./dev-wallet.json`)
}

function decodeKeypairToBase58() {
    try {
        const walletData = JSON.parse(fs.readFileSync('./dev-wallet.json', 'utf-8'))
        const secretKey = new Uint8Array(walletData.privateKey)
        const base58SecretKey = bs58.encode(secretKey)
        console.log(`\nBase58 encoded secret key:`)
        console.log(base58SecretKey)
    } catch (error: any) {
        console.error("\nError reading wallet file:", error.message)
    }
}

async function viewWallet(filename: string) {
    const walletData = JSON.parse(fs.readFileSync(`./${filename}`, 'utf-8'))
    console.log(`\nSolana Wallet:`)
    console.log(`Public Key: ${walletData.publicKey}`)
    console.log(`Private Key: ${walletData.privateKey}`)
    const connection = new Connection("https://api.devnet.solana.com");
    const balance = await connection.getBalance(new PublicKey(walletData.publicKey));
    console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`)
}

async function viewDevWallet() {
    await viewWallet("dev-wallet.json")
}

async function viewTurbin3Wallet() {
    await viewWallet("Turbin3-wallet.json")
}


function convertBase58ToKeypair() {
    const base58Key = input("\nEnter base58 secret key: ")
    try {
        const secretKey = bs58.decode(base58Key)
        const kp = Keypair.fromSecretKey(secretKey)
        const walletFile = {
            privateKey: Array.from(secretKey),
            publicKey: kp.publicKey.toBase58()
        }
        
        fs.writeFileSync('./Turbin3-wallet.json', JSON.stringify(walletFile, null, 2))
        console.log(`\nWallet converted and saved!`)
        console.log(`Public Key: ${kp.publicKey.toBase58()}`)
        console.log(`Wallet saved to ./Turbin3-wallet.json`)
    } catch (error: any) {
        console.error("\nError converting base58 key:", error.message)
    }
}

async function main() {
    while (true) {
        const choice = displayMenu()
        
        switch (choice) {
            case '1':
                generateNewKeypair()
                break
            case '2':
                decodeKeypairToBase58()
                break
            case '3':
                convertBase58ToKeypair()
                break
            case '4':
                await viewDevWallet()
                break
            case '5':
                await viewTurbin3Wallet()
                break
            case '6':
                createKeypairFromBinary()
                break
            case '7':
                console.log("\nGoodbye!")
                process.exit(0)
            default:
                console.log("\nInvalid option. Please try again.")
        }
    }
}

main()

