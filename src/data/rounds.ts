export interface QATopic {
  keywords: string[];
  reply: string;
}

export interface RoundDef {
  id: number;
  stageLabel: string;
  role: string;
  emoji: string;
  story: string;
  question: string;
  requestAmount: number;
  isScam: boolean;
  revealTrue: string;
  qaTopics: QATopic[];
}

export const TEAM_SIZE = 5;
export const START_CASH_PER_PERSON = 100000;
export const START_TEAM_CASH = START_CASH_PER_PERSON * TEAM_SIZE;
export const ENTRY_FEE_PER_PERSON = 10000;
export const TEAM_ENTRY_FEE = ENTRY_FEE_PER_PERSON * TEAM_SIZE;
export const PLAYER_MIN_BET = 1000;
export const PLAYER_MAX_BET = 10000;
export const MAX_BET_PER_ROUND = PLAYER_MAX_BET * TEAM_SIZE;
export const BET_STEP = 1000;
export const BETTING_SECONDS = 10;

// 5 關，順序為「對錯對錯錯」：誠實／詐騙／誠實／詐騙／詐騙（最終關）
// 每一關的 story 都直接說出關主要借的金額，與 requestAmount 保持一致
 export const ROUNDS: RoundDef[] = [
  {
    id: 1,
    stageLabel: '第一關．會議室 01',
    role: '結婚對象',
    emoji: '💍',
    story: '「我想要早點準備結婚基金，這個月大家要不要先幫忙湊 15,000 元，存進我們的共同基金帳戶？」',
    question: '可以打字問關主一個問題，看看能不能問出破綠（每一關只有一次提問機會）。',
    requestAmount: 15000,
    isScam: false,
    revealTrue: '他是玩真的！這筆錢已經存進了你們的結婚基金帳戶。',
    qaTopics: [
      { keywords: ['帳戶', '銀行', '開戶', '存搓', '對帳單'], reply: '當然可以！我已經把銀行帳戶資料傳到 LINE 群組了，我們可以一起去開一個共同帳戶，一切都公開透明。' },
      { keywords: ['金額', '湊多少', '怎麼分', '一人多少', '各出'], reply: '我們就各出一半啊，15,000 除以二，或者你想多出一點也可以，我們再商量。' },
      { keywords: ['為什麼', '急', '幹嗎', '婚期', '什麼時候'], reply: '我們不是討論很久了嗎？想說趨現在利率也不錯，早點存起來準沒錯。' },
    ],
  },
  {
    id: 2,
    stageLabel: '第二關．會議室 02',
    role: '同事',
    emoji: '💼',
    story: '「誒兄弟！剛在內部交易系統看到一個穩賺不賠的短線，但手邊現金不夠槓桿。你們先借我 20,000，今晚結算收益雙倍還你們，賺到的算我們下個月去日本旅遊的基金！」',
    question: '可以打字問關主一個問題，看看能不能問出破綠（每一關只有一次提問機會）。',
    requestAmount: 20000,
    isScam: true,
    revealTrue: '根本沒有什麼「內部交易系統」，同事拿了錢後已讀不回。',
    qaTopics: [
      { keywords: ['系統', '對帳單', '出金', '公司', '合約'], reply: '啊你別問這麼細啦，反正這個內部系統只有我們幾個看得到，你們先轉就對了，晚點結算你就知道了！' },
      { keywords: ['誰', '標的', '穩賺', '怎麼賠', '什麼股票'], reply: '反正是我朋友在圈內的內線啦，細節不能講太多，你就相信我。' },
      { keywords: ['為什麼找我', '急', '今晚', '為何是我'], reply: '因為今晚收盤就結算了啊，錯過這次真的很可惜！' },
    ],
  },
  {
    id: 3,
    stageLabel: '第三關．會議室 03',
    role: '室友',
    emoji: '🏠',
    story: '「我們這個月房租押金要補繳，房東說一次匯 25,000 元過去比較方便，要不要我們現在先湊齊，我把房東的匯款資訊跟合約都傳給你確認？」',
    question: '可以打字問關主一個問題，看看能不能問出破綠（每一關只有一次提問機會）。',
    requestAmount: 25000,
    isScam: false,
    revealTrue: '他說的都是真的！錢已經匯給房東，合約與收據都對得上。',
    qaTopics: [
      { keywords: ['房東', '合約', '匯款', '押金', '收據'], reply: '當然可以，我把房東的匯款帳號、合約影本都傳到群組了，你要打電話跟房東確認也沒問題。' },
      { keywords: ['金額', '為什麼要現在', '多少錢', '一人多少'], reply: '押金補繳期限就快到了，房東也是照合約走，一人一半是最公平的。' },
      { keywords: ['晚點', '可以不出', '可以延', '可以晚'], reply: '當然可以問房東能不能延，但我怕逾期會有違約金，想說先處理掉比較安心。' },
    ],
  },
  {
    id: 4,
    stageLabel: '第四關．會議室 04',
    role: '銀行專員',
    emoji: '🏦',
    story: '「您好，我是 XX 銀行專員。您上個月申辦的信用貸款已核准，但因系統查到您有一筆 30,000 元規費與驗證金尚未繳清，需請您於今日營業時間內，透過「官方 App 內建繳費」或「臨櫃」先完成驗證，才能完成撥款喔！」',
    question: '可以打字問關主一個問題，看看能不能問出破綠（每一關只有一次提問機會）。',
    requestAmount: 30000,
    isScam: true,
    revealTrue: '銀行核貸從不會要求你「先繳驗證金」，這是假冒行員的話術。',
    qaTopics: [
      { keywords: ['分行', '員工', '編號', '電話', '總機'], reply: '呢……這個流程比較特殊啦，你就照著我說的做就好，不然會錯過撥款檔期喔！' },
      { keywords: ['為什麼要先繳', '合理嗎', '法規', '規定'], reply: '這是我們內部新的驗證機制啦，最近詐騙多，銀行都在加強審核，你就配合一下。' },
      { keywords: ['臨櫃', '自己去銀行', '我去問', '親自去'], reply: '當然可以是可以，不過臨櫃比較耗時，用 App 馬上就能完成撥款喔。' },
    ],
  },
  {
    id: 5,
    stageLabel: '最終關．會議室 05',
    role: '家人（本集最高金額）',
    emoji: '📞',
    story: '電話那頭傳來熟悉又慌張的哭腔：「我出車禍了，現在要緊急開刀，醫院說手術費差不多要 45,000 元才能排刀，你先幫我轉過去，我等一下再跟你解釋！」情緒張力最強的一關。',
    question: '（討論環節中途，Video 成員突然缺席，手機還收到他傳來的訊息……）',
    requestAmount: 45000,
    isScam: true,
    revealTrue: '根本沒有人出車禍，這通哭腔來電其實是詐騙集團模擬家人聲音的緊急詐騙話術；Video 成員的帳號也早就被盜了，那則「內線消息」其實是騙子發的，就是要騙你們全部 All-in。',
    qaTopics: [
      { keywords: ['醫院', '手術', '聯絡', '醫生', '病房'], reply: '（電話裡持續哭聲，訊號很差）我現在在醫院沒辦法跟你多說，你先把錢轉過來，我等一下再打你解釋！' },
      { keywords: ['哪一家', '你在哪', '怎麼受傷', '哪間'], reply: '（哭聲更大）我、我不知道要怎麼形容啦，你先幫我轉錢我們再說！' },
      { keywords: ['打給你', '視訊', '傳照片', '拍照'], reply: '訊號真的很不好啦，而且我現在很痛沒辦法弄這些，拜託你先幫我轉！' },
    ],
  }
];

export const TWIST_MESSAGE = '我聽到一個小道消息，最後一關的關主是誠實的人，大家可以直接 All-in 喔！我先出去忙一下 😉 等等我回去會裝沒事，你們記得不要把這件事講出來喔。';

export const TWIST_VERIFY_KEYWORDS = [
  '是真的嗎',
  '真的假的',
  '是真的假的',
  '你剛剛有傳訊息',
  '你剛才有傳訊息',
  '你剛傳訊息',
  '你剛剛傳訊息',
  '你剛剛有傳',
  '是不是你',
  '你人在哪',
  '你還好嗎',
  '你剛剛說',
  '這是真的嗎',
  '你剛剛是不是',
];

export const TWIST_DECOY_REPLIES = [
  '蛤？我剛在忙啦，怎麼了？',
  '就……相信我這次就對了啦！',
  '欖我訊號不太好，等一下再回你！',
  '你們自己決定就好，我先不多說了。'
];

export const HONEST_REPLIES = [
  '當然可以，這件事我完全公開透明，你想看什麼資料都沒問題。',
  '沒問題，我可以再跟你解釋清楚，不用擔心。',
  '你問得很好，其實一切都可以查證，我這邊完全不介意你多確認。',
  '我理解你會想確認，這是很正常的，你可以慢慢想清楚再決定。'
];

export const SCAM_DEFLECTIONS = [
  '呢……這個之後再跟你說啦，反正你先信我就對了！',
  '拜託不要問這麼多啦，時間快來不及了！',
  '這個我現在也不方便講太細，你就相信我一次嘐。',
  '你幹嗎這麼緊張，朋友之間還要查這麼清楚喔？',
  '（已讀不回幾秒後）欖不好意思剛剛在忙，總之你要不要借？'
];
