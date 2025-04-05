async function loadPopup() {
    try {
      const res = await fetch('http://127.0.0.1:5001/generate-address');
      const data = await res.json();
      if (data.success) {
        document.getElementById('address').textContent = data.address;
        const qrCode = document.getElementById('qrcode');
        qrCode.innerHTML = '';
        new QRCode(qrCode, data.address);
      } else {
        document.getElementById('address').textContent = 'Error: ' + data.error;
      }
    } catch (err) {
      document.getElementById('address').textContent = 'Error contacting backend.';
    }
  
    loadBalance();
    loadTransactions();
  }
  
  async function loadBalance() {
    try {
      const res = await fetch('http://127.0.0.1:5001/wallet-balance');
      const data = await res.json();
      if (data.success) {
        document.getElementById('balance').textContent = `${data.balance_sats} sats`;
      } else {
        document.getElementById('balance').textContent = 'Error loading balance';
      }
    } catch {
      document.getElementById('balance').textContent = 'Error loading balance';
    }
  }
  
  async function loadTransactions() {
    try {
      const res = await fetch('http://127.0.0.1:5001/transactions');
      const data = await res.json();
      const container = document.getElementById('transactions');
      container.innerHTML = '';
      if (data.success && data.transactions.length > 0) {
        data.transactions.slice(0, 3).forEach(tx => {
          const el = document.createElement('div');
          el.className = 'tx';
          el.innerHTML = `Address: ${tx.address}<br>TXID: ${tx.txid.slice(0, 12)}...`;
          container.appendChild(el);
        });
      } else {
        container.textContent = 'No transactions.';
      }
    } catch {
      document.getElementById('transactions').textContent = 'Error loading transactions';
    }
  }
  
  document.getElementById('generate').addEventListener('click', loadPopup);
  window.onload = loadPopup;
  