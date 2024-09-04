// ==UserScript==
// @name         Twitch Coffre Autoclaim Customisé avec Statistiques
// @version      1.1.1
// @description  Automatisation personnalisée pour la réclamation des points de chaîne Twitch avec statistiques et estimation des gains
// @author       Ry1ex
// @match        https://www.twitch.tv/*
// @namespace    https://github.com/Ry1ex/Twitch-Coffre-Autoclaim
// @run-at       document-idle
// ==/UserScript==

// ==== SETTINGS ====
var autoRun = true;
var retries = -1; // Nombre de cycles pour essayer de charger votre solde de points avant d'abandonner.
// == END SETTINGS ==

class GestionnaireDePointsDeChaine {
    constructor() {
        this.soldeInitial = -1;
        this.solde = this.soldeInitial;
        this.autoRun = autoRun;
        this.startTime = new Date(); // Temps de démarrage du script
        this.multiplicateur = 1; // Multiplicateur de points pour les abonnés
        this.stats = {
            totalCoffresCliqués: 0,
            pointsGagnés: 0, // Points gagnés depuis le démarrage du script
            pointsEstimes: 0,
            soldeActuel: 0, // Nouveau pour afficher le solde actuel exact sous forme de texte
        };
        this.init();
        this.afficherStatistiquesToutesLes30Minutes(); // Mise à jour des statistiques toutes les 30 minutes
        this.observerDOMChanges(); // Observer les changements dans le DOM pour insérer le texte
        this.simulerPresenceUtilisateur(); // Simuler la présence de l'utilisateur sur la page
    }

    init() {
        console.log(this.tempsString() + " [CPA Custom Stats] Début de l'automatisation de la réclamation des points de chaîne avec statistiques.");
        setTimeout(() => this.verifierAbonnement(), 5000); // Attendre 5 secondes avant de vérifier l'état d'abonnement
        if (this.autoRun) {
            console.log(this.tempsString() + " [CPA Custom Stats] En cours d'exécution...");
            this.run();
        }
    }

    verifierAbonnement() {
        const boutonGerAbonnement = document.querySelector('[data-test-selector="manage-sub-button"]');
        const boutonSAbonner = document.querySelector('[data-test-selector="subscribe-button"], [data-a-target="subscribe-button"]');
        const niveauAbonnement = document.querySelector('[data-test-selector="subscription-details__selected-or-current-tier"]');

        if (boutonGerAbonnement) {
            console.log(this.tempsString() + " [CPA Custom Stats] Utilisateur possède un abonnement.");
            if (niveauAbonnement) {
                let niveau = niveauAbonnement.textContent.trim();
                switch (niveau) {
                    case 'Niveau 1':
                        this.multiplicateur = 1.2;
                        console.log(this.tempsString() + " [CPA Custom Stats] Identification abonnement: Niveau 1");
                        break;
                    case 'Niveau 2':
                        this.multiplicateur = 1.4;
                        console.log(this.tempsString() + " [CPA Custom Stats] Identification abonnement: Niveau 2");
                        break;
                    case 'Niveau 3':
                        this.multiplicateur = 2;
                        console.log(this.tempsString() + " [CPA Custom Stats] Identification abonnement: Niveau 3");
                        break;
                    default:
                        this.multiplicateur = 1;
                        console.log(this.tempsString() + " [CPA Custom Stats] Identification abonnement: Inconnu");
                }
            } else {
                this.multiplicateur = 1.2; // Par défaut niveau 1
                console.log(this.tempsString() + " [CPA Custom Stats] Identification abonnement: Niveau 1 (par défaut)");
            }
        } else if (boutonSAbonner) {
            console.log(this.tempsString() + " [CPA Custom Stats] L'utilisateur n'est pas abonné.");
            this.multiplicateur = 1; // Pas de multiplicateur
        } else {
            console.log(this.tempsString() + " [CPA Custom Stats] Impossible de déterminer l'état d'abonnement. Réessayer...");
            setTimeout(() => this.verifierAbonnement(), 5000); // Réessayer après 5 secondes
        }
    }

    run() {
        this.cliquerSurCoffre();

        let nouveauSolde = this.obtenirSolde();
        if (nouveauSolde !== '-1' && this.soldeInitial === -1) {
            this.soldeInitial = this.convertirEnNombre(nouveauSolde);
            this.solde = this.soldeInitial;
            this.stats.soldeActuel = this.soldeInitial; // Afficher le solde exact
        } else if (nouveauSolde !== '-1') {
            let pointsGagnes = this.calculerPointsDepuisDebut(nouveauSolde);
            this.stats.pointsGagnés += pointsGagnes;
            this.stats.soldeActuel = this.convertirEnNombre(nouveauSolde); // Mise à jour du solde actuel sous forme de nombre
            console.log(this.tempsString() + " [CPA Custom Stats] Points gagnés depuis le début : " + this.stats.pointsGagnés);
        }

        this.calculerPointsEstimes(); // Calculer les points estimés en fonction des actions et du multiplicateur
        this.mettreAJourAffichageStats(); // Mettre à jour l'affichage des statistiques

        if (this.autoRun) {
            setTimeout(() => this.run(), 1000); // Répéter toutes les secondes
        } else {
            console.log(this.tempsString() + " [CPA Custom Stats] Aucun point de chaîne trouvé. Arrêt du script.");
        }
    }

    cliquerSurCoffre() {
        var coffres = document.querySelectorAll(".claimable-bonus__icon, .claimable-bonus__icon--animated");
        if (coffres.length > 0) {
            for (let coffre of coffres) {
                coffre.click();
                this.stats.totalCoffresCliqués++;
                this.stats.pointsGagnés += 50 * this.multiplicateur; // Ajouter 50 points par coffre, ajusté pour les abonnés
                console.log(this.tempsString() + " [CPA Custom Stats] Coffre bonus cliqué. Total cliqué : " + this.stats.totalCoffresCliqués);
                this.mettreAJourAffichageStats(); // Mettre à jour l'affichage immédiatement après avoir cliqué sur un coffre
            }
        }
    }

    obtenirSolde() {
        return '-1'; // Placeholder, as we're not focusing on fetching balance here
    }

    calculerPointsDepuisDebut(nouveauSolde) {
        let ancienSolde = this.convertirEnNombre(this.solde);
        nouveauSolde = this.convertirEnNombre(nouveauSolde);
        this.solde = nouveauSolde; // Mettre à jour le solde actuel

        if (nouveauSolde > ancienSolde) {
            return (nouveauSolde - ancienSolde);
        }
        return 0;
    }

    calculerPointsEstimes() {
        const pointsParCoffreSansAbonnement = 50;
        const pointsRegarder5Minutes = 10;
        let tempsEcouleMinutes = Math.floor((new Date() - this.startTime) / 1000 / 60);
        let pointsParCoffreAvecAbonnement = pointsParCoffreSansAbonnement * this.multiplicateur;

        this.stats.pointsEstimes = (pointsRegarder5Minutes * Math.floor(tempsEcouleMinutes / 5) + this.stats.totalCoffresCliqués * pointsParCoffreAvecAbonnement);
    }

    convertirEnNombre(solde) {
        if (typeof solde === 'string' && solde.toLowerCase().includes('k')) {
            return parseFloat(solde.toLowerCase().replace('k', '')) * 1000;
        }
        return parseInt(solde.replace(/,/g, ''), 10);
    }

    observerDOMChanges() {
        const observer = new MutationObserver((mutations, obs) => {
            let h3Element = document.querySelector('h3.ScTitleText-sc-d9mj2s-0'); // Trouve le premier h3
            if (h3Element && !document.getElementById('affichage-stats')) {
                obs.disconnect();
                let statsDiv = document.createElement('div');
                statsDiv.id = 'affichage-stats';
                statsDiv.style.backgroundColor = '#18181B'; // Couleur de fond noir Twitch
                statsDiv.style.padding = '10px';
                statsDiv.style.border = '1px solid #333';
                statsDiv.style.borderRadius = '5px';
                statsDiv.style.marginBottom = '10px';
                statsDiv.style.width = '100%';

                h3Element.parentElement.insertBefore(statsDiv, h3Element); // Insère avant l'élément H3
                this.mettreAJourAffichageStats();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    mettreAJourAffichageStats() {
        let statsDiv = document.getElementById('affichage-stats');
        if (statsDiv) {
            let tempsEcoule = this.calculerTempsEcoule();
            let coffresParMinute = (this.stats.totalCoffresCliqués / ((new Date() - this.startTime) / 1000 / 60)).toFixed(2);
            let coffresParHeure = (coffresParMinute * 60).toFixed(2);
            statsDiv.innerHTML = `
                <p>Vous regardez le stream depuis <span style="color: #9146FF; font-family: monospace;">${tempsEcoule}</span>.</p>
                <div style="border-top: 1px solid #ccc; margin: 5px 0;"></div>
                <p>Vous avez gagné <span style="color: #9146FF;">${this.stats.pointsGagnés.toLocaleString('fr-FR')}</span> points depuis votre présence<span style="color: #9146FF; cursor: help;" title="Valeur théorique car nous ne pouvons pas récupérer le solde précis des points du compte sans perturber visuellement l'utilisateur.">*</span>.</p>
                <div style="border-top: 1px solid #ccc; margin: 5px 0;"></div>
                <p>Vous avez récolté automatiquement <span style="color: #9146FF;">${this.stats.totalCoffresCliqués}</span> coffres.</p>
                <div style="border-top: 1px solid #ccc; margin: 5px 0;"></div>
                <p>Soit <span style="color: #9146FF;">${coffresParHeure}</span> coffres par heure.</p>
            `;
        }
    }

    afficherStatistiquesToutesLes30Minutes() {
        setInterval(() => {
            let tempsEcoule = this.calculerTempsEcoule();
            console.log(this.tempsString() + ` [CPA Custom Stats] Vous avez gagné ${this.stats.pointsGagnés} points depuis ${tempsEcoule} que vous regardez le stream.`);
        }, 1800000); // 30 minutes en millisecondes
    }

    calculerTempsEcoule() {
        let maintenant = new Date();
        let diffMs = maintenant - this.startTime;
        let diffSecs = Math.floor(diffMs / 1000);
        let diffMins = Math.floor(diffSecs / 60);
        let diffHeures = Math.floor(diffMins / 60);
        diffSecs = diffSecs % 60;
        diffMins = diffMins % 60;
        return `<span style="color: #9146FF; font-family: monospace;">${diffHeures}</span> heures, <span style="color: #9146FF; font-family: monospace;">${diffMins}</span> minutes et <span style="color: #9146FF; font-family: monospace;">${diffSecs}</span> secondes`;
    }

    tempsString() {
        let maintenant = new Date();
        return [maintenant.getHours(), maintenant.getMinutes(), maintenant.getSeconds()].map(t => t < 10 ? '0' + t : t).join(':');
    }

    simulerPresenceUtilisateur() {
        window.addEventListener('focus', () => {
            console.log(this.tempsString() + " [CPA Custom Stats] L'onglet est actif.");
        });

        // Check visibility every 5 seconds and force the tab to stay active
        setInterval(() => {
            if (document.hidden) {
                console.log(this.tempsString() + " [CPA Custom Stats] Forçage du focus car l'onglet est caché.");
                window.focus();
            } else {
                console.log(this.tempsString() + " [CPA Custom Stats] L'onglet est visible.");
            }
        }, 5000);

        // Simulate mouse movement and keyboard events to show activity
        setInterval(() => {
            document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
            document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Shift' }));
        }, 5000); // Envoie un événement toutes les 5 secondes
    }
}

new GestionnaireDePointsDeChaine();
