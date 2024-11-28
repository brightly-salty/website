import BonusRoom from '../../quizbowl/BonusRoom.js';
import api from '../scripts/api/index.js';

export default class ClientBonusRoom extends BonusRoom {
  constructor (name, categories = [], subcategories = [], alternateSubcategories = []) {
    super(name, categories, subcategories, alternateSubcategories);

    this.checkAnswer = api.checkAnswer;
    this.getRandomQuestions = async (args) => await api.getRandomBonus({ ...args });
    this.getSet = async ({ setName, packetNumbers }) => setName ? await api.getPacketBonuses(setName, packetNumbers[0] ?? 1) : [];
    this.getSetList = api.getSetList;
    this.getNumPackets = api.getNumPackets;

    this.setList = this.getSetList();

    this.settings = {
      ...this.settings,
      skip: true,
      showHistory: true,
      typeToAnswer: true
    };
  }

  async message (userId, message) {
    switch (message.type) {
      case 'toggle-show-history': return this.toggleShowHistory(userId, message);
      case 'toggle-type-to-answer': return this.toggleTypeToAnswer(userId, message);
      default: super.message(userId, message);
    }
  }

  get liveAnswer () {
    return document.getElementById('answer-input').value;
  }

  set liveAnswer (value) {
    document.getElementById('answer-input').value = value;
  }

  startAnswer (teamId) {
    if (!this.settings.typeToAnswer) {
      this.giveAnswer(teamId, { givenAnswer: this.bonus.answers_sanitized[this.currentPartNumber] });
      return;
    }

    super.startAnswer(teamId);
  }

  toggleShowHistory (userId, { showHistory }) {
    this.settings.showHistory = showHistory;
    this.emitMessage({ type: 'toggle-show-history', showHistory, userId });
  }

  toggleTypeToAnswer (teamId, { typeToAnswer }) {
    this.settings.typeToAnswer = typeToAnswer;
    this.emitMessage({ type: 'toggle-type-to-answer', typeToAnswer, teamId });
  }
}
