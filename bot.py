import asyncio
import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from web3 import Web3
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.callbacks import EarlyStopping
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import MACD, SMAIndicator, ADXIndicator
from ta.volatility import BollingerBands

# הגדרות ראשוניות
# =======================
TELEGRAM_TOKEN = "7808322309:AAFNGvGcI8Gk_PGmDMmtLcCbZhVuahHgiZI"
bsc = "https://bsc-dataseed.binance.org/"
web3 = Web3(Web3.HTTPProvider(bsc))
prediction_address = web3.to_checksum_address('0x18b2a687610328590bc8f2e5fedde3b582a49cda')

# =======================
# ABI של החוזה החכם
# =======================

abi =[{"inputs":[{"internalType":"address","name":"_oracleAddress","type":"address"},
{"internalType":"address","name":"_adminAddress","type":"address"},
{"internalType":"address","name":"_operatorAddress","type":"address"},
{"internalType":"uint256","name":"_intervalSeconds","type":"uint256"},
{"internalType":"uint256","name":"_bufferSeconds","type":"uint256"},
{"internalType":"uint256","name":"_minBetAmount","type":"uint256"},
{"internalType":"uint256","name":"_oracleUpdateAllowance","type":"uint256"},
{"internalType":"uint256","name":"_treasuryFee","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"sender","type":"address"},
{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetBear","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"sender","type":"address"},
{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetBull","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"sender","type":"address"},
{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claim","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"}
,{"indexed":True,"internalType":"uint256","name":"roundId","type":"uint256"},
{"indexed":False,"internalType":"int256","name":"price","type":"int256"}],"name":"EndRound","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"},
{"indexed":True,"internalType":"uint256","name":"roundId","type":"uint256"},
{"indexed":False,"internalType":"int256","name":"price","type":"int256"}],"name":"LockRound","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"address","name":"admin","type":"address"}],"name":"NewAdminAddress","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"uint256","name":"bufferSeconds","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"intervalSeconds","type":"uint256"}],"name":"NewBufferAndIntervalSeconds","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"minBetAmount","type":"uint256"}],"name":"NewMinBetAmount","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"address","name":"operator","type":"address"}],"name":"NewOperatorAddress","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"address","name":"oracle","type":"address"}],"name":"NewOracle","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"uint256","name":"oracleUpdateAllowance","type":"uint256"}],"name":"NewOracleUpdateAllowance","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"treasuryFee","type":"uint256"}],"name":"NewTreasuryFee","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"previousOwner","type":"address"},
{"indexed":True,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"Pause","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"rewardBaseCalAmount","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"rewardAmount","type":"uint256"},
{"indexed":False,"internalType":"uint256","name":"treasuryAmount","type":"uint256"}],"name":"RewardsCalculated","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"StartRound","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"token","type":"address"},
{"indexed":False,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokenRecovery","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TreasuryClaim","type":"event"},
{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"Unpause","type":"event"},
{"anonymous":False,"inputs":[{"indexed":False,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},
{"inputs":[],"name":"MAX_TREASURY_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"adminAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"betBear","outputs":[],"stateMutability":"payable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"betBull","outputs":[],"stateMutability":"payable","type":"function"},
{"inputs":[],"name":"bufferSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"uint256[]","name":"epochs","type":"uint256[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"claimTreasury","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},
{"internalType":"address","name":"user","type":"address"}],"name":"claimable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"currentEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"executeRound","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"genesisLockOnce","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"genesisLockRound","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"genesisStartOnce","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"genesisStartRound","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"user","type":"address"},
{"internalType":"uint256","name":"cursor","type":"uint256"},
{"internalType":"uint256","name":"size","type":"uint256"}],"name":"getUserRounds","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"},
{"components":[{"internalType":"enum PancakePredictionV2.Position","name":"position","type":"uint8"},
{"internalType":"uint256","name":"amount","type":"uint256"},
{"internalType":"bool","name":"claimed","type":"bool"}],"internalType":"struct PancakePredictionV2.BetInfo[]","name":"","type":"tuple[]"},
{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserRoundsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"intervalSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},
{"internalType":"address","name":"","type":"address"}],"name":"ledger","outputs":[{"internalType":"enum PancakePredictionV2.Position","name":"position","type":"uint8"},
{"internalType":"uint256","name":"amount","type":"uint256"},
{"internalType":"bool","name":"claimed","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"minBetAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"operatorAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"oracle","outputs":[{"internalType":"contract AggregatorV3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"oracleLatestRoundId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"oracleUpdateAllowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"recoverToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},
{"internalType":"address","name":"user","type":"address"}],"name":"refundable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rounds","outputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},
{"internalType":"uint256","name":"startTimestamp","type":"uint256"},
{"internalType":"uint256","name":"lockTimestamp","type":"uint256"},
{"internalType":"uint256","name":"closeTimestamp","type":"uint256"},
{"internalType":"int256","name":"lockPrice","type":"int256"},
{"internalType":"int256","name":"closePrice","type":"int256"},
{"internalType":"uint256","name":"lockOracleId","type":"uint256"},
{"internalType":"uint256","name":"closeOracleId","type":"uint256"},
{"internalType":"uint256","name":"totalAmount","type":"uint256"},
{"internalType":"uint256","name":"bullAmount","type":"uint256"},
{"internalType":"uint256","name":"bearAmount","type":"uint256"},
{"internalType":"uint256","name":"rewardBaseCalAmount","type":"uint256"},
{"internalType":"uint256","name":"rewardAmount","type":"uint256"},
{"internalType":"bool","name":"oracleCalled","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"address","name":"_adminAddress","type":"address"}],"name":"setAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"_bufferSeconds","type":"uint256"},{"internalType":"uint256","name":"_intervalSeconds","type":"uint256"}],"name":"setBufferAndIntervalSeconds","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"_minBetAmount","type":"uint256"}],"name":"setMinBetAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"_operatorAddress","type":"address"}],"name":"setOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"name":"setOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"_oracleUpdateAllowance","type":"uint256"}],"name":"setOracleUpdateAllowance","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"_treasuryFee","type":"uint256"}],"name":"setTreasuryFee","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"treasuryAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"treasuryFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userRounds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
]


# =======================
# חיבור לחוזה החכם
# =======================
prediction_contract = web3.eth.contract(address=prediction_address, abi=abi)
print("connected to contract")
def fetch_round_data(epoch):
    try:
        round_data = prediction_contract.functions.rounds(epoch).call()
        print(f"נתונים על סיבוב {epoch}:")
        print(f"מחיר נעילה: {round_data[4]}")
        print(f"מחיר סגירה: {round_data[5]}")
        print(f"האם אורקל עודכן: {round_data[13]}")
        return round_data
    except Exception as e:
        print(f"שגיאה בשליפת נתונים: {e}")
        return None


# =======================
# משיכת מחירים בזמן אמת
# =======================
def get_crypto_prices():
    symbols = ["BNBUSDT", "BTCUSDT", "ETHUSDT"]
    prices = {}
    for symbol in symbols:
        url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}"
        response = requests.get(url)
        prices[symbol] = float(response.json()['price'])
    return prices

# =======================
# ניתוח סנטימנט מחדשות
# =======================
def get_sentiment_score():
    # לדוגמה: שילוב עם API שנותן סנטימנט
    url = "https://api.alternative.me/fng/"
    response = requests.get(url)
    data = response.json()
    return int(data['data'][0]['value'])

# =======================
# איסוף נתונים מתקדם
# =======================
def fetch_prediction_data():
    current_epoch = prediction_contract.functions.currentEpoch().call()
    data = []

    for epoch in range(current_epoch - 150, current_epoch):
        round_data = prediction_contract.functions.rounds(epoch).call()
        lock_price, close_price = round_data[1], round_data[2]
        result = 1 if close_price > lock_price else 0
        crypto_prices = get_crypto_prices()
        sentiment = get_sentiment_score()
        data.append([lock_price, close_price, crypto_prices["BNBUSDT"], crypto_prices["BTCUSDT"], crypto_prices["ETHUSDT"], sentiment, result])

    df = pd.DataFrame(data, columns=["lock_price", "close_price", "bnb_price", "btc_price", "eth_price", "sentiment", "result"])

    # אינדיקטורים טכניים
    df['RSI'] = RSIIndicator(close=df['close_price']).rsi()
    df['MACD'] = MACD(close=df['close_price']).macd_diff()
    df['SMA'] = SMAIndicator(close=df['close_price']).sma_indicator()
    df['Stochastic'] = StochasticOscillator(high=df['lock_price'], low=df['close_price'], close=df['close_price']).stoch()
    df['Bollinger'] = BollingerBands(close=df['close_price']).bollinger_hband()
    df['ADX'] = ADXIndicator(high=df['lock_price'], low=df['close_price'], close=df['close_price']).adx()

    df.fillna(method='bfill', inplace=True)
    return df

# =======================
# בניית מודל Bidirectional LSTM
# =======================
def build_bidirectional_lstm(input_shape):
    model = Sequential()
    model.add(Bidirectional(LSTM(128, return_sequences=True), input_shape=input_shape))
    model.add(Dropout(0.4))
    model.add(Bidirectional(LSTM(64)))
    model.add(Dropout(0.4))
    model.add(Dense(1, activation='sigmoid'))
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

# =======================
# אימון מודלים משולבים
# =======================
def train_advanced_models():
    df = fetch_prediction_data()
    features = df[['lock_price', 'close_price', 'bnb_price', 'btc_price', 'eth_price', 'sentiment', 'RSI', 'MACD', 'SMA', 'Stochastic', 'Bollinger', 'ADX']]
    target = df['result']

    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(features)

    # Random Forest
    rf_model = RandomForestClassifier(n_estimators=800, max_depth=30, random_state=42)

    # XGBoost
    xgb_model = XGBClassifier(n_estimators=800, learning_rate=0.001, max_depth=25)

    # LightGBM
    lgb_model = LGBMClassifier(n_estimators=800, learning_rate=0.001, max_depth=25)

    # Stacking
    stacked_model = StackingClassifier(estimators=[('rf', rf_model), ('xgb', xgb_model)], final_estimator=lgb_model)
    stacked_model.fit(X_scaled, target)

    # Bidirectional LSTM
    lstm_model = build_bidirectional_lstm((X_scaled.shape[1], 1))
    early_stop = EarlyStopping(monitor='loss', patience=10)
    lstm_model.fit(X_scaled.reshape(X_scaled.shape[0], X_scaled.shape[1], 1), target, epochs=200, batch_size=32, verbose=0, callbacks=[early_stop])

    return stacked_model, lstm_model, scaler

# =======================
# חיזוי מתקדם
# =======================
def advanced_prediction(stacked_model, lstm_model, scaler):
    crypto_prices = get_crypto_prices()
    sentiment = get_sentiment_score()
    X_new = scaler.transform([[crypto_prices["BNBUSDT"], crypto_prices["BTCUSDT"], crypto_prices["ETHUSDT"], sentiment, 50, 0, 0, 0, 0, 0, 0]])

    lstm_pred = lstm_model.predict(X_new.reshape(1, X_new.shape[1], 1))[0][0]
    stacked_pred = stacked_model.predict(X_new)[0]

    final_prediction = round((lstm_pred + stacked_pred) / 2)
    return "🔼 עלייה" if final_prediction == 1 else "🔽 ירידה"

# =======================
# הפעלת בוט טלגרם
# =======================
async def predict(update: Update, context: ContextTypes.DEFAULT_TYPE):
    stacked_model, lstm_model, scaler = train_advanced_models()
    prediction = advanced_prediction(stacked_model, lstm_model, scaler)
    await update.message.reply_text(f"התחזית לסיבוב הבא: {prediction}")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("הבוט פועל!")

app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
app.add_handler(CommandHandler("start", start))

app.add_handler(CommandHandler("predict", predict))
app.run_polling()


async def start_bot():
    print("bot is on")
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    print("✅ Bot is running!")

    await app.initialize()
    await app.start()
    await app.updater.start_polling()

if __name__ == "__main__":
    import asyncio

    try:
        asyncio.run(start_bot())
    except (KeyboardInterrupt, SystemExit):
        print("⛔️ Bot stopped.")
