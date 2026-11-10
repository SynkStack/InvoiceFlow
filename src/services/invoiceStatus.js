// Which statuses an invoice may move to from each status
const TRANSITIONS = {
  draft: ['sent'],
  sent: ['paid', 'overdue'],
  overdue: ['paid'],
  paid: [], // final state
};

// Pure function: no database, easy to test
function canTransition(from, to) {
  return Object.hasOwn(TRANSITIONS, from) && TRANSITIONS[from].includes(to);
}

module.exports = { TRANSITIONS, canTransition };