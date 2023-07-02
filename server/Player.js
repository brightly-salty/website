class Player {
    constructor(userId) {
        this.userId = userId;
        this.username = '';
        this.powers = 0;
        this.tens = 0;
        this.zeroes = 0;
        this.negs = 0;
        this.points = 0;
        this.tuh = 0;
        this.celerity = {
            all: {
                total: 0,
                average: 0,
            },
            correct: {
                total: 0,
                average: 0,
            },
        };
    }

    clearStats() {
        this.powers = 0;
        this.tens = 0;
        this.zeroes = 0;
        this.negs = 0;
        this.points = 0;
        this.tuh = 0;
        this.celerity = {
            all: {
                total: 0,
                average: 0,
            },
            correct: {
                total: 0,
                average: 0,
            },
        };
    }

    updateStats(points, celerity) {
        this.points += points;
        this.celerity.all.total += celerity;
        this.celerity.all.average = this.celerity.all.total / this.tuh;

        if (points > 10) {
            this.powers++;
        } else if (points === 10) {
            this.tens++;
        } else if (points === 0) {
            this.zeroes++;
        } else if (points < 0) {
            this.negs++;
        }

        if (points > 0) {
            this.celerity.correct.total += celerity;
            this.celerity.correct.average = this.celerity.correct.total / (this.powers + this.tens);
        }
    }

    updateUsername(username) {
        this.username = username;
    }
}

export default Player;
