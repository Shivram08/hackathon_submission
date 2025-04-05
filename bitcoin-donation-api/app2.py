from flask import Flask, jsonify, render_template
from bit import PrivateKeyTestnet
from datetime import datetime
import os
import json

app = Flask(__name__)
ADDRESS_FILE = 'addresses_bit.json'

# --- Load/Save Address Records ---
def load_addresses():
    if not os.path.exists(ADDRESS_FILE):
        with open(ADDRESS_FILE, 'w') as f:
            json.dump([], f)
    with open(ADDRESS_FILE) as f:
        return json.load(f)

def save_address(address, wif):
    addresses = load_addresses()
    addresses.append({
        'address': address,
        'wif': wif,
        'timestamp': datetime.utcnow().isoformat()
    })
    with open(ADDRESS_FILE, 'w') as f:
        json.dump(addresses, f, indent=2)

# --- API: Generate New Address ---
@app.route('/generate-address', methods=['GET'])
def generate_address():
    try:
        key = PrivateKeyTestnet()
        address = key.address
        wif = key.to_wif()
        save_address(address, wif)
        return jsonify({'success': True, 'address': address})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# --- API: Get Wallet Balance ---
@app.route('/wallet-balance', methods=['GET'])
def wallet_balance():
    try:
        from bit.network import NetworkAPI
        total_sats = 0
        for entry in load_addresses():
            key = PrivateKeyTestnet(entry['wif'])
            balance = float(key.get_balance('btc'))
            total_sats += int(balance * 1e8)
        return jsonify({'success': True, 'balance_sats': total_sats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# --- API: Get Transactions ---
@app.route('/transactions', methods=['GET'])
def transactions():
    try:
        txs = []
        for entry in load_addresses():
            key = PrivateKeyTestnet(entry['wif'])
            try:
                txids = key.get_transactions()
                for txid in txids[:5]:
                    txs.append({
                        'address': key.address,
                        'txid': txid
                    })
            except Exception as e:
                print(f"[WARN] Failed to fetch txs for {key.address}: {e}")
        return jsonify({'success': True, 'transactions': txs})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/addresses')
def addresses():
    return jsonify(load_addresses())

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# --- Run on a different port ---
if __name__ == '__main__':
    app.run(debug=True, port=5001)
