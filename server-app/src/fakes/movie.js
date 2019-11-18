const { hacker } = require("faker");

module.exports.getFakeMovie = () => ({
  title: `${hacker.abbreviation()}: ${hacker.verb()} ${hacker.adjective()} `,
  description: hacker.phrase()
});
