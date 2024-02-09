const express = require("express");
const data = require('./gear.js');
const _ = require('lodash');
var cors = require('cors');
const app = express();

app.use(express.json())
app.use(cors())

const getCombinations = (properties, size, items)  => {
  const result = [];
  function generate(combination, index) {
    if (combination.length >= size) {
      result.push(combination);
    } else {
      for (let i=index; i<items.length; i++) {
        const item = items[i];

        const totalJewels = combination.filter(i => i.slot === 'jewel').length
        let props = [...properties];
        if (totalJewels < 2 && item.slot === 'jewel') { props = props.filter(p => p !== 'slot') }

        if (props.every(prop =>
          combination.every(prevItem => {
            return prevItem[prop] != item[prop]
          })
        )) {
          generate([...combination, item], i+1);
        }
      }
    }
  }
  generate([], 0);
  return result;
};

app.get("/", (req, res) => {
  const gear = data.gear;
  const filterWithPredicates = (list, predicates) => (
    list.filter(item => (
      Object.values(predicates).every(predicate => predicate(item))
    ))
  );
  const { minLevel, maxLevel, realms, slots, effects, types, sigils, sortBy, order, combos } = req.query;
  console.log('tacocat', realms, req.query)

  const predicates = {
    level: (record) => record.level >= minLevel && record.level <= maxLevel,
  };

  if (realms && realms.length > 0) {
    predicates.realm = (record) => realms.includes(record.realm);
  }

  if (slots && slots.length > 0) {
    predicates.slot = (record) => slots.includes(record.slot);
    // if we're looking for jewels, we also want to include items that don't have a slot
    if (slots.includes('jewel')) {
      types.push('')
    }
  }

  if (effects && effects.length > 0) {
    predicates.spell = (record) => effects.includes(record.spell);
  }

  if (types && types.length > 0) {
    predicates.type = (record) => types.includes(record.type);
  }

  if (sigils && sigils.length > 0) {
    predicates.sigil = (record) => sigils.includes(record.sigil);
  }

  const matches = filterWithPredicates(gear, predicates);

  if (combos) {
    // figure out a better way to display same item from multiple mobs
    const result = getCombinations(['slot', 'spell', 'item'], 8, matches);
    res.send(_.orderBy(result, sortBy, order));
  }
  res.send(_.orderBy(matches, sortBy, order));
});

app.get("/initialize", (req, res) => {
  const getUniqueOptions = (arr, key) => {
    const uni =  _.uniqBy(arr, key);
    const opts =  uni.map((item) => {
      // if the key is empty, we want to include it in the list
      if (!item[key]) return { value: '', label: 'other' };
      return { value: item[key], label: item[key] };
    });
  
    return _.sortBy(opts, ['value']);
  };

  const withoutWeapons = data.gear.filter((item) => item.slot !== 'weapon');

  const realmOptions = getUniqueOptions(data.gear, 'realm');
  const slotOptions = getUniqueOptions(data.gear, 'slot');
  const effectOptions = getUniqueOptions(withoutWeapons, 'spell');
  const typeOptions = getUniqueOptions(data.gear, 'type');
  const sigilOptions = getUniqueOptions(data.gear, 'sigil');

  res.send({ realmOptions, slotOptions, effectOptions, typeOptions, sigilOptions });
});

app.post("/", async (req, res) => {
  
});

app.listen(5000, () => {
  console.log("Running on port 5000.");
});

// Export the Express API
module.exports = app;