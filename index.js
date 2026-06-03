const https = require("https");
const express = require("express");
const app = express();
app.set('json spaces', 2);
const axios = require("axios");
const agent = new https.Agent({
    rejectUnauthorized: false
});

const url = "https://pokeapi.co/api/v2/pokemon";

function getpmdata() {
    return new Promise((resolve, reject) => {
        https.get(url, { agent }, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                resolve(JSON.parse(data));
            });
            res.on("error", (err) => {
                reject(err);
            });
        })
    });
}

getpmdata().then(data => {
    console.log(data);
}).catch(err => {
    console.error(err);
});

function findTwoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

let arr = [1, 2, 3, 1]
console.log(...new Set(arr));

const pokemon = [
    { name: 'Pikachu', type: 'electric' },
    { name: 'Raichu', type: 'electric' },
    { name: 'Charizard', type: 'fire' }
];

groupedOne = {};
for (let i = 0; i < pokemon.length; i++) {
    if (groupedOne[pokemon[i].type]) {
        groupedOne[pokemon[i].type].push(pokemon[i]);
    } else {
        groupedOne[pokemon[i].type] = [pokemon[i]];
    }
}
console.log(groupedOne)

const grouped = pokemon.reduce((acc, curr) => {
    if (!acc[curr.type]) {
        acc[curr.type] = [];
    }
    acc[curr.type].push(curr);
    return acc;
}, {});

console.log(grouped)

app.get("/all", async (req, res) => {
    const response = await axios.get(url, { httpsAgent: agent });
    const list = response.data.results;
    const details = await Promise.all(
        list.map(async (p) => {
            const response = await axios.get(p.url, { httpsAgent: agent });
            return response.data;
        })
    );
    const data = details.map(p => ({
        id: p.id,
        name: p.name,
        image: p.sprites.front_default,
        types: p.types.map(t => t.type.name),
    }))
    res.json(data);
})

app.get("/:id", async (req, res) => {
    const response = await axios.get(`${url}/${req.params.id}`, { httpsAgent: agent });
    res.json(response.data);
})

// Fetch all pokemon details and transform for UI
async function getPokemonDetails() {
    const response = await axios.get(url, { httpsAgent: agent });
    const list = response.data.results;

    const details = Promise.all(
        list.map(async (p) => {
            const response = await axios.get(p.url, { httpsAgent: agent });
            return response.data;
        })
    );

    const uiData = details.map(p => ({
        id: p.id,
        name: p.name,
        image: p.sprites.front_default,
        types: p.types.map(t => t.type.name),
        stats: p.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
        height: p.height,
        weight: p.weight
    }));

    return uiData;
}

app.get("/api/pokemon-details", async (req, res) => {
    const uiData = await getPokemonDetails();
    res.json(uiData);
})

// Recursive fetch one-by-one
async function fetchRecursive(list, index = 0, results = []) {
    if (index >= list.length) return results;

    const r = await axios.get(list[index].url, { httpsAgent: agent });
    results.push({
        id: r.data.id,
        name: r.data.name,
        image: r.data.sprites.front_default,
        types: r.data.types.map(t => t.type.name)
    });

    return fetchRecursive(list, index + 1, results);
}

app.get("/api/pokemon-recursive", async (req, res) => {
    const response = await axios.get(url, { httpsAgent: agent });
    const list = response.data.results;
    const uiData = await fetchRecursive(list);
    res.json(uiData);
})

// Paginated recursion - fetches ALL pages
async function fetchAllPages(pageUrl, allResults = []) {
    const r = await axios.get(pageUrl, { httpsAgent: agent });
    allResults.push(...r.data.results);

    if (r.data.next) {
        return fetchAllPages(r.data.next, allResults);
    }
    return allResults;
}

app.get("/api/pokemon-all", async (req, res) => {
    const allPokemon = await fetchAllPages(url);
    res.json({ count: allPokemon.length, results: allPokemon });
})

app.listen(3002)