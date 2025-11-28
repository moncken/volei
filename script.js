const STORAGE_KEY = 'registeredVolleyballPlayers';
let registeredPlayers = loadRegisteredPlayers();
let selectedPlayersForGame = [];
let currentEditIndex = null;
let currentFilter = '';

const playerNameInput = document.getElementById('newPlayerName');
const playerLevelSelect = document.getElementById('newPlayerLevel');
const submitPlayerBtn = document.getElementById('submit-player-btn');
const formHelperText = document.getElementById('form-helper');

const registeredCountEl = document.getElementById('registered-count');
const selectedCountEl = document.getElementById('selected-count');
const balanceInfoEl = document.getElementById('balance-info');
const modeInfoEl = document.getElementById('mode-info');

function init() {
    displayRegisteredPlayers();
    updateSummaryCards();
}

document.addEventListener('DOMContentLoaded', init);

function toggleAddPlayerForm() {
    const form = document.getElementById('add-player-form');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        form.style.height = 'auto';
        playerNameInput.focus();
    } else {
        form.style.height = '0';
        resetFormState();
    }
}

function cancelPlayerForm() {
    const form = document.getElementById('add-player-form');
    form.classList.add('hidden');
    form.style.height = '0';
    resetFormState();
}

function resetFormState() {
    playerNameInput.value = '';
    playerLevelSelect.value = 'iniciante';
    currentEditIndex = null;
    submitPlayerBtn.textContent = 'Cadastrar';
    formHelperText.textContent = 'Use nomes únicos para evitar confusões. Você pode editar depois.';
}

function registerNewPlayer() {
    const playerName = playerNameInput.value.trim();
    const playerLevel = playerLevelSelect.value;

    if (!playerName) {
        alert('Por favor, insira o nome do jogador.');
        return;
    }

    const isDuplicate = registeredPlayers.some((player, index) =>
        player.name.toLowerCase() === playerName.toLowerCase() && index !== currentEditIndex
    );

    if (isDuplicate) {
        alert('Já existe um jogador com esse nome. Use um nome diferente.');
        return;
    }

    const playerData = { name: playerName, level: playerLevel };

    if (currentEditIndex !== null) {
        const previousName = registeredPlayers[currentEditIndex].name;
        registeredPlayers[currentEditIndex] = playerData;
        selectedPlayersForGame = selectedPlayersForGame.map(p =>
            p.name === previousName ? playerData : p
        );
    } else {
        registeredPlayers.push(playerData);
    }

    saveRegisteredPlayers();
    displayRegisteredPlayers();
    displayAvailablePlayersForSelection();
    updateSummaryCards();
    cancelPlayerForm();
}

function displayRegisteredPlayers() {
    const playersListDiv = document.getElementById('registered-players-list');
    playersListDiv.innerHTML = '';

    if (registeredPlayers.length === 0) {
        playersListDiv.innerHTML = '<p>Nenhum jogador cadastrado ainda.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    registeredPlayers.forEach((player, index) => {
        const card = document.createElement('div');
        card.classList.add('player-card');
        card.innerHTML = `
            <div>
                <p class="player-name">${player.name}</p>
                <p class="player-meta">Nível: <span class="level-badge ${player.level}">${player.level}</span></p>
            </div>
            <div class="action-group">
                <button class="ghost" onclick="editRegisteredPlayer(${index})">Editar</button>
                <button class="ghost danger" onclick="removeRegisteredPlayer(${index})">Remover</button>
            </div>
        `;
        fragment.appendChild(card);
    });

    playersListDiv.appendChild(fragment);
    displayAvailablePlayersForSelection();
}

function editRegisteredPlayer(index) {
    currentEditIndex = index;
    playerNameInput.value = registeredPlayers[index].name;
    playerLevelSelect.value = registeredPlayers[index].level;
    submitPlayerBtn.textContent = 'Salvar alterações';
    formHelperText.textContent = 'Atualize o nome ou o nível e clique em salvar.';

    const form = document.getElementById('add-player-form');
    form.classList.remove('hidden');
    form.style.height = 'auto';
    playerNameInput.focus();
}

function removeRegisteredPlayer(index) {
    const confirmation = confirm('Deseja realmente remover este jogador?');
    if (!confirmation) return;

    const removedPlayer = registeredPlayers.splice(index, 1)[0];
    selectedPlayersForGame = selectedPlayersForGame.filter(p => p.name !== removedPlayer.name);

    saveRegisteredPlayers();
    displayRegisteredPlayers();
    displayAvailablePlayersForSelection();
    updateSummaryCards();
}

function displayAvailablePlayersForSelection() {
    const availablePlayersDiv = document.getElementById('available-players-list');
    availablePlayersDiv.innerHTML = '';

    if (registeredPlayers.length === 0) {
        availablePlayersDiv.innerHTML = '<p>Cadastre jogadores para selecioná-los para a partida.</p>';
        document.getElementById('generate-teams-btn').disabled = true;
        updateSummaryCards();
        return;
    }

    const ul = document.createElement('ul');
    const normalizedFilter = currentFilter.trim().toLowerCase();

    registeredPlayers
        .filter(player => player.name.toLowerCase().includes(normalizedFilter))
        .forEach((player, index) => {
            const li = document.createElement('li');
            li.classList.add('player-selection-item');

            const switchDiv = document.createElement('label');
            switchDiv.classList.add('onoff-switch');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = index;
            checkbox.addEventListener('change', handlePlayerSelection);
            checkbox.id = `playerSwitch-${index}`;

            const isAlreadySelected = selectedPlayersForGame.some(p => p.name === player.name);
            checkbox.checked = isAlreadySelected;

            const sliderSpan = document.createElement('span');
            sliderSpan.classList.add('slider', 'round');
            sliderSpan.classList.toggle('off', !isAlreadySelected);

            switchDiv.appendChild(checkbox);
            switchDiv.appendChild(sliderSpan);

            const label = document.createElement('label');
            label.textContent = `${player.name} `;
            label.classList.add('player-name-label');
            label.setAttribute('for', `playerSwitch-${index}`);

            const levelBadgeSpan = document.createElement('span');
            levelBadgeSpan.classList.add('level-badge', player.level);
            levelBadgeSpan.textContent = player.level;

            label.appendChild(levelBadgeSpan);

            li.appendChild(switchDiv);
            li.appendChild(label);
            ul.appendChild(li);
        });

    availablePlayersDiv.appendChild(ul);
    document.getElementById('generate-teams-btn').disabled = selectedPlayersForGame.length < 6;
    updateSummaryCards();
}

function filterPlayers() {
    const filterInput = document.getElementById('playerFilter');
    currentFilter = filterInput.value || '';
    displayAvailablePlayersForSelection();
}

function clearSelection() {
    selectedPlayersForGame = [];
    const checkboxes = document.querySelectorAll('#available-players-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        const slider = checkbox.nextElementSibling;
        slider.classList.add('off');
    });
    document.getElementById('generate-teams-btn').disabled = true;
    updateSummaryCards();
}

function resetAllData() {
    const confirmed = confirm('Limpar todos os jogadores e seleções? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    registeredPlayers = [];
    selectedPlayersForGame = [];
    saveRegisteredPlayers();
    displayRegisteredPlayers();
    displayAvailablePlayersForSelection();
    updateSummaryCards();
}

function handlePlayerSelection(event) {
    const playerIndex = parseInt(event.target.value, 10);
    const player = registeredPlayers[playerIndex];
    const slider = event.target.nextElementSibling;

    if (event.target.checked) {
        if (!selectedPlayersForGame.some(p => p.name === player.name)) {
            selectedPlayersForGame.push(player);
        }
        slider.classList.remove('off');
    } else {
        selectedPlayersForGame = selectedPlayersForGame.filter(p => p.name !== player.name);
        slider.classList.add('off');
    }

    const generateTeamsButton = document.getElementById('generate-teams-btn');
    generateTeamsButton.disabled = selectedPlayersForGame.length < 6;
    updateSummaryCards();
}

function generateTeams() {
    if (selectedPlayersForGame.length < 6) {
        alert('Selecione pelo menos 6 jogadores para formar os times.');
        return;
    }

    const teamsOutputDiv = document.getElementById('teams-output');
    const tournamentBracketDiv = document.getElementById('tournament-bracket');
    const nonTournamentTeamsDiv = document.getElementById('non-tournament-teams');
    const initialTeamsDiv = document.getElementById('initial-teams');
    const rotationPlansDiv = document.getElementById('rotation-plans');
    const outsidePlayersInfoDiv = document.getElementById('outside-players-info');
    const roundRotationDiv = document.getElementById('round-rotation');

    tournamentBracketDiv.classList.add('hidden');
    nonTournamentTeamsDiv.classList.add('hidden');
    initialTeamsDiv.innerHTML = '';
    rotationPlansDiv.classList.add('hidden');
    roundRotationDiv.innerHTML = '';
    outsidePlayersInfoDiv.innerHTML = '';

    const playersForTeamFormation = [...selectedPlayersForGame];
    shuffleArray(playersForTeamFormation);

    let balancedTeams;

    if (playersForTeamFormation.length === 24) {
        tournamentBracketDiv.classList.remove('hidden');
        nonTournamentTeamsDiv.classList.add('hidden');
        balancedTeams = createBalancedTeams(playersForTeamFormation, 4, 6);
        displayTournamentBracket(balancedTeams, tournamentBracketDiv.querySelector('.bracket'));
        modeInfoEl.textContent = 'Torneio (4 times)';
    } else {
        nonTournamentTeamsDiv.classList.remove('hidden');
        tournamentBracketDiv.classList.add('hidden');
        const numTeams = Math.floor(playersForTeamFormation.length / 6);
        const numOutsidePlayers = playersForTeamFormation.length % 6;
        let teams = [];
        let outsidePlayers = [];

        if (numOutsidePlayers > 0) {
            outsidePlayers = playersForTeamFormation.slice(-numOutsidePlayers);
            teams = createBalancedTeams(
                playersForTeamFormation.slice(0, playersForTeamFormation.length - numOutsidePlayers),
                numTeams,
                6
            );
        } else {
            teams = createBalancedTeams(playersForTeamFormation, numTeams, 6);
        }

        displayInitialTeams(teams, initialTeamsDiv);

        if (numOutsidePlayers > 0) {
            rotationPlansDiv.classList.remove('hidden');
            displayOutsidePlayersInfo(outsidePlayers, outsidePlayersInfoDiv);
            if (numOutsidePlayers >= 4 && numOutsidePlayers <= 5) {
                displayRotationPlanForLargeOutsideGroup(teams, outsidePlayers, roundRotationDiv);
            } else {
                displaySimplifiedRotationPlans(teams, outsidePlayers, roundRotationDiv);
            }
        }

        modeInfoEl.textContent = `${numTeams} time(s) em quadra${numOutsidePlayers ? ` e ${numOutsidePlayers} fora` : ''}`;
    }

    teamsOutputDiv.classList.remove('hidden');
    updateSummaryCards();
}

function createBalancedTeams(playerList, numTeams, teamSize) {
    const leveledPlayers = playerList.map(player => {
        let levelValue;
        switch (player.level) {
            case 'iniciante': levelValue = 1; break;
            case 'intermediario': levelValue = 2; break;
            case 'avancado': levelValue = 3; break;
            default: levelValue = 1;
        }
        return { ...player, levelValue };
    });

    leveledPlayers.sort((a, b) => b.levelValue - a.levelValue);

    const teams = Array.from({ length: numTeams }, () => []);
    const teamLevelSums = Array(numTeams).fill(0);
    const teamLevelCounts = Array.from({ length: numTeams }, () => ({ iniciante: 0, intermediario: 0, avancado: 0 }));

    leveledPlayers.forEach(player => {
        let teamIndexToAddTo = teamLevelSums.indexOf(Math.min(...teamLevelSums));
        teams[teamIndexToAddTo].push(player);
        teamLevelSums[teamIndexToAddTo] += player.levelValue;
        teamLevelCounts[teamIndexToAddTo][player.level]++;
    });

    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 0; i < numTeams; i++) {
            for (let j = i + 1; j < numTeams; j++) {
                for (let playerIndex1 = 0; playerIndex1 < teams[i].length; playerIndex1++) {
                    for (let playerIndex2 = 0; playerIndex2 < teams[j].length; playerIndex2++) {
                        const player1 = teams[i][playerIndex1];
                        const player2 = teams[j][playerIndex2];

                        if ((teamLevelCounts[i].avancado > teamLevelCounts[j].avancado && player1.levelValue > player2.levelValue) ||
                            (teamLevelCounts[i].iniciante < teamLevelCounts[j].iniciante && player1.levelValue < player2.levelValue)) {

                            const newTeamLevelSumI = teamLevelSums[i] - player1.levelValue + player2.levelValue;
                            const newTeamLevelSumJ = teamLevelSums[j] - player2.levelValue + player1.levelValue;

                            if (Math.abs(newTeamLevelSumI - newTeamLevelSumJ) < Math.abs(teamLevelSums[i] - teamLevelSums[j])) {
                                teams[i][playerIndex1] = player2;
                                teams[j][playerIndex2] = player1;
                                teamLevelSums[i] = newTeamLevelSumI;
                                teamLevelSums[j] = newTeamLevelSumJ;

                                teamLevelCounts[i][player1.level]--;
                                teamLevelCounts[i][player2.level]++;
                                teamLevelCounts[j][player2.level]--;
                                teamLevelCounts[j][player1.level]++;

                                improved = true;
                            }
                        }
                    }
                }
            }
        }
        if (!improved) break;
    }

    return teams;
}

function displayInitialTeams(teams, outputDiv) {
    outputDiv.innerHTML = '';
    teams.forEach((team, index) => {
        outputDiv.innerHTML += `
            <div class="team">
                <h4>Time ${index + 1}</h4>
                <ul>
                    ${team.map(player => `<li>${player.name} <span class="level-badge ${player.level}">${player.level}</span></li>`).join('')}
                </ul>
            </div>
        `;
    });
}

function displayOutsidePlayersInfo(outsidePlayers, outputDiv) {
    outputDiv.innerHTML = `
        <div class="outside-players-list">
            <h3>Jogadores de Fora (${outsidePlayers.length}):</h3>
            <p>Jogadores que aguardam para as próximas rodadas:</p>
            <ul>
                ${outsidePlayers.map(player => `<li>${player.name} <span class="level-badge ${player.level}">${player.level}</span></li>`).join('')}
            </ul>
        </div>
    `;
}

function displaySimplifiedRotationPlans(teams, outsidePlayers, outputDiv) {
    outputDiv.innerHTML = '<div class="rotation-plans-grid">';
    outsidePlayers.forEach((outsidePlayer) => {
        outputDiv.innerHTML += `
            <div class="rotation-scenario">
                <h4>Rotação para: ${outsidePlayer.name} <span class="level-badge ${outsidePlayer.level}">${outsidePlayer.level}</span></h4>
        `;
        teams.forEach((team, teamIndex) => {
            const teamLevelSum = team.reduce((sum, p) => sum + getLevelValue(p.level), 0);
            let bestPlayerToReplaceIndex = -1;
            let minLevelDiff = Infinity;

            team.forEach((playerToRemove, playerToRemoveIndex) => {
                const newTeamLevelSum = teamLevelSum - getLevelValue(playerToRemove.level) + getLevelValue(outsidePlayer.level);
                const levelDiff = Math.abs(newTeamLevelSum - teamLevelSum);

                if (levelDiff < minLevelDiff) {
                    minLevelDiff = levelDiff;
                    bestPlayerToReplaceIndex = playerToRemoveIndex;
                }
            });

            const playerToRemove = team[bestPlayerToReplaceIndex];

            outputDiv.innerHTML += `<h5>Se Time ${teamIndex + 1} Perder:</h5>`;
            outputDiv.innerHTML += `
                <div class="scenario-detail">
                    <p><strong>${outsidePlayer.name} <span class="level-badge ${outsidePlayer.level}">${outsidePlayer.level}</span></strong> entra no lugar de <strong>${playerToRemove.name} <span class="level-badge ${playerToRemove.level}">${playerToRemove.level}</span></strong> (Time ${teamIndex + 1}).</p>
                    <p><strong>Time ${teamIndex + 1} (com ${outsidePlayer.name}):</strong></p>
                    <ul>
                        ${team.map((p, index) => index === bestPlayerToReplaceIndex ? `<li>${outsidePlayer.name} <span class="level-badge ${outsidePlayer.level}">${outsidePlayer.level}</span> (Entrando)</li>` : `<li>${p.name} <span class="level-badge ${p.level}">${p.level}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        });
        outputDiv.innerHTML += `</div>`;
    });
    outputDiv.innerHTML += '</div>';
}

function displayRotationPlanForLargeOutsideGroup(teams, outsidePlayers, outputDiv) {
    outputDiv.innerHTML = '<div class="rotation-plans-grid">';

    const outsideTeam = [...outsidePlayers];

    teams.forEach((losingTeam, losingTeamIndex) => {
        outputDiv.innerHTML += `
            <div class="rotation-scenario">
                <h4>Rotação se Time ${losingTeamIndex + 1} Perder (com ${outsidePlayers.length} de fora):</h4>
        `;

        let cedePlayersIndices = [];
        let numPlayersToCede = 0;

        if (outsidePlayers.length === 5) {
            numPlayersToCede = 1;
        } else if (outsidePlayers.length === 4) {
            numPlayersToCede = 2;
        }

        if (numPlayersToCede > 0) {
            cedePlayersIndices = findPlayersToCede(losingTeam, numPlayersToCede);
        }

        const cedePlayers = cedePlayersIndices.map(index => losingTeam[index]);
        const remainingLosingTeam = losingTeam.filter((_, index) => !cedePlayersIndices.includes(index));

        let newTeamWithOutside = [];
        if (outsidePlayers.length === 5) {
            newTeamWithOutside = [...outsideTeam, cedePlayers[0]];
        } else if (outsidePlayers.length === 4) {
            newTeamWithOutside = [...outsideTeam, ...cedePlayers];
        }

        let cedePlayersNames = cedePlayers.map(p => `<strong>${p.name} <span class="level-badge ${p.level}">${p.level}</span></strong>`).join(' e ');
        if (cedePlayersNames) {
            outputDiv.innerHTML += `<p>Se o <strong>Time ${losingTeamIndex + 1}</strong> perder, ele cede ${cedePlayersNames} para formar um novo time com os jogadores de fora.</p>`;
        } else {
            outputDiv.innerHTML += `<p>Se o <strong>Time ${losingTeamIndex + 1}</strong> perder, ele cede jogadores para formar um novo time com os jogadores de fora.</p>`;
        }

        outputDiv.innerHTML += `
            <h5>Novo Time com Jogadores de Fora:</h5>
            <ul>
                ${newTeamWithOutside.map(player => `<li>${player.name} <span class="level-badge ${player.level}">${player.level}</span></li>`).join('')}
            </ul>
            <h5>Time ${losingTeamIndex + 1} (após ceder jogadores):</h5>
            <ul>
                ${remainingLosingTeam.map(player => `<li>${player.name} <span class="level-badge ${player.level}">${player.level}</span></li>`).join('')}
            </ul>
        `;

        outputDiv.innerHTML += `</div>`;
    });
    outputDiv.innerHTML += '</div>';
}

function findPlayersToCede(team, numToCede) {
    const leveledTeam = team.map((player, index) => ({ ...player, index }));
    leveledTeam.sort((a, b) => getLevelValue(a.level) - getLevelValue(b.level));

    return leveledTeam.slice(0, numToCede).map(p => p.index);
}

function displayTournamentBracket(teams, bracketDiv) {
    bracketDiv.innerHTML = '';
    const roundsData = [
        { name: 'Quartas de Final', matches: [[0, 1], [2, 3]] },
        { name: 'Final', matches: [[0, 1]] }
    ];

    roundsData.forEach((round, roundIndex) => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('round');
        roundDiv.innerHTML = `<h3>${round.name}</h3>`;

        roundDiv.style.position = 'relative';

        round.matches.forEach(matchPair => {
            const matchDiv = document.createElement('div');
            matchDiv.classList.add('match');
            matchDiv.innerHTML = `
                <h5>Jogo ${roundIndex === 0 ? matchPair[0] + 1 + ' vs ' + (matchPair[1] + 1) : 'Final'}</h5>
                <div>
                    <p><strong>Time ${matchPair[0] + 1}:</strong></p>
                    <ul>
                        ${teams[matchPair[0]].map(player => `<li>${player.name} <span class="level-badge ${player.level}">${player.level}</span></li>`).join('')}
                    </ul>
                </div>
                <p>vs</p>
                <div>
                    <p><strong>Time ${matchPair[1] + 1}:</strong></p>
                    <ul>
                        ${teams[matchPair[1]].map(player => `<li>${player.name} <span class="level-badge ${player.level}">${player.level}</span></li>`).join('')}
                    </ul>
                </div>
            `;
            roundDiv.appendChild(matchDiv);
        });
        bracketDiv.appendChild(roundDiv);
    });
}

function getLevelValue(level) {
    switch (level) {
        case 'iniciante': return 1;
        case 'intermediario': return 2;
        case 'avancado': return 3;
        default: return 1;
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function calculateAverageLevel(players) {
    if (!players.length) return '-';
    const total = players.reduce((sum, player) => sum + getLevelValue(player.level), 0);
    return (total / players.length).toFixed(1);
}

function updateSummaryCards() {
    registeredCountEl.textContent = registeredPlayers.length;
    selectedCountEl.textContent = selectedPlayersForGame.length;
    balanceInfoEl.textContent = calculateAverageLevel(selectedPlayersForGame);
    if (selectedPlayersForGame.length === 0) {
        modeInfoEl.textContent = 'Aguardando seleção';
    }
}

function saveRegisteredPlayers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredPlayers));
}

function loadRegisteredPlayers() {
    const storedPlayers = localStorage.getItem(STORAGE_KEY);
    return storedPlayers ? JSON.parse(storedPlayers) : [];
}
