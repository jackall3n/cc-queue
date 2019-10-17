const axios = require('axios');
const cheerio = require('cheerio');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const { _, ...argv } = require('minimist')(process.argv.slice(2), {
    boolean: ['status'],
    default: {
        count: 1,
        delay: 5000,
        status: false
    }
});

console.log(argv);

db.defaults({ queues: [] })
    .write();

const queueUrl = "https://coppaclub.queue-it.net/?c=coppaclub&e=towerbridgeigloos&cid=en-GB&l=Igloos%2520TB%2520October%25202019";
const statusUrl = (id) => `https://coppaclub.queue-it.net/queue/coppaclub/towerbridgeigloos/${id}/GetStatus?cid=en-GB&l=Igloos%20TB%20October%202019`;
const emailUrl = (id) => `https://coppaclub.queue-it.net/queue/coppaclub/towerbridgeigloos/${id}/UpdateEmail/?cid=en-GB`;

const linkUrl = (id) => `https://coppaclub.queue-it.net/?c=coppaclub&e=towerbridgeigloos&q=${id}&t=https%3A%2F%2Fwww.coppaclub.co.uk%2Ftowerbridge%2Fbook%2F&cid=en-GB&l=Igloos%20TB%20October%202019`;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const joinQueue = async () => {
    const response = await axios.get(queueUrl);
    const { data } = response;
    const $ = cheerio.load(data);

    // console.log(data);

    return $('#hlLinkToQueueTicket2').text();
};

const get = async () => {

    const id = await joinQueue();

    if (!id) {
        console.log('failed to retrieve id');

        return;
    }

    await delay(1000);

    let queueNumber = -1;
    let usersInLineAheadOfYou = -1;

    if (argv.status) {
        try {
            const status = await getStatus(id);

            queueNumber = status.ticket.queueNumber;
            usersInLineAheadOfYou = status.ticket.usersInLineAheadOfYou;
        } catch (error) {
            console.log('failed to validate');
        }
    }

    await db.get('queues')
        .push({ id, link: linkUrl(id), queueNumber, usersInLineAheadOfYou })
        .write();
};

const getStatus = async (id) => {

    const response = await axios.post(statusUrl(id), {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const { queueNumber, usersInLineAheadOfYou } = response.data.ticket;

    console.log(queueNumber, usersInLineAheadOfYou);

    return response.data;

};

const updateEmail = async (id) => {
    const email = `jackallensmail+${id}@gmail.com`;

    const response = await axios.post(emailUrl(id), {
        email: email,
        targetUrl: "",
        customUrlParams: "",
        layoutName: "Igloos TB October 2019"
    });

    console.log(response);
};

for (let i = 1; i <= argv.count; i++) {
    setTimeout(async function timer() {
        console.log('Getting...', i);
        await get();
    }, i * argv.delay);
}
