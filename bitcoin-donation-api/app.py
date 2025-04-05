from flask import Flask, jsonify, render_template
from bitcoinlib.wallets import Wallet
from datetime import datetime
import os
import json

app = Flask(__name__)

WALLET_NAME = 'DonationWallet'
NETWORK = 'testnet'
ADDRESS_FILE = 'addresses.json'


# --- Wallet Setup ---
def initialize_wallet():
    try:
        wallet = Wallet(WALLET_NAME)
    except:
        # Create wallet with a dummy key, then delete it
        wallet = Wallet.create(WALLET_NAME, network=NETWORK, witness_type='segwit')
        try:
            first_key = wallet.keys()[0]
            wallet.key_delete(first_key.key_id)
        except Exception:
            pass

    # Import all saved donation addresses
    addresses = [entry['address'] for entry in load_addresses()]
    for addr in addresses:
        try:
            wallet.import_address(addr)
        except:
            pass

    wallet.scan()
    return wallet





# --- Load/Save Addresses ---
def load_addresses():
    if not os.path.exists(ADDRESS_FILE):
        with open(ADDRESS_FILE, 'w') as f:
            json.dump([], f)
    with open(ADDRESS_FILE) as f:
        return json.load(f)

def save_address(new_address):
    addresses = load_addresses()
    addresses.append({
        'address': new_address,
        'timestamp': datetime.utcnow().isoformat()
    })
    with open(ADDRESS_FILE, 'w') as f:
        json.dump(addresses, f, indent=2)

# --- Import all saved addresses into the wallet ---
def import_saved_addresses(wallet):
    addresses = load_addresses()
    for entry in addresses:
        try:
            wallet.import_address(entry['address'])
        except Exception:
            pass  # avoid duplicate import errors

# --- Routes ---

@app.route('/generate-address', methods=['GET'])
def generate_address():
    try:
        wallet = initialize_wallet()
        key = wallet.new_key()
        save_address(key.address)
        return jsonify({'success': True, 'address': key.address})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/addresses', methods=['GET'])
def list_addresses():
    try:
        addresses = load_addresses()
        return jsonify({'success': True, 'addresses': addresses})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/wallet-balance', methods=['GET'])
def wallet_balance():
    try:
        wallet = initialize_wallet()
        import_saved_addresses(wallet)
        wallet.scan()

        balance = wallet.balance()
        return jsonify({'success': True, 'balance_sats': int(balance * 1e8)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/transactions', methods=['GET'])
def get_transactions():
    try:
        wallet = initialize_wallet()
        import_saved_addresses(wallet)
        wallet.scan()

        txs = wallet.transactions()
        tx_list = [{
            'txid': tx.txid,
            'amount_sats': int(tx.amount * 1e8),
            'to': tx.output_address,
            'confirmations': tx.confirmations,
            'timestamp': tx.date.isoformat() if tx.date else 'N/A'
        } for tx in txs if tx.amount > 0]

        return jsonify({'success': True, 'transactions': tx_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

if __name__ == '__main__':
    app.run(debug=True)
