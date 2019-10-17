const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const axios = require('axios');

const statusUrl = (id) => `https://coppaclub.queue-it.net/queue/coppaclub/towerbridgeigloos/${id}/GetStatus?cid=en-GB&l=Igloos%20TB%20October%202019`;

const queues = db.get('queues').value();

const getStatus = async (id) => {

    try {
        const response = await axios.post(statusUrl(id), {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const { queueNumber, usersInLineAheadOfYou } = response.data.ticket;

        console.log(queueNumber, usersInLineAheadOfYou);

        return response.data;
    } catch (ex) {
        console.log(ex);

        return {
            ticket: {
                queueNumber: -2,
                usersInLineAheadOfYou: -2
            }
        }

    }
};

const updateStatuses = async () => {
    for (const { id } of queues) {
        const status = await getStatus(id);

        const { queueNumber, usersInLineAheadOfYou } = status.ticket;

        await db.get('queues').find({ id }).assign({ queueNumber, usersInLineAheadOfYou }).write();
    }
};

updateStatuses();
