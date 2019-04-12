import { injectable } from "inversify";
import * as pg from "pg";
import "reflect-metadata";
import { Animal } from "../../../common/tables/Animal";

@injectable()
export class DatabaseService {

    // A MODIFIER POUR VOTRE BD
    public connectionConfig: pg.ConnectionConfig = {
        user: "sysadmin",
        database: "vet",
        password: "1234",
        port: 5433,
        host: "127.0.0.1",
        keepAlive : true
    };

    private pool: pg.Pool = new pg.Pool(this.connectionConfig);

    public constructor() {
        this.pool.connect().catch((erreur: unknown) => console.dir(erreur));
    }

    // Animal
    public async getAnimals(): Promise<pg.QueryResult> {

        return this.pool.query(`SELECT * FROM vetdb.animal;`);
    }
    public async getProprietaires(): Promise<pg.QueryResult> {

        return this.pool.query(`SELECT * FROM vetdb.proprietaire;`);
    }
    public async getProprietairesByClinique(cliniqueNumero: string): Promise<pg.QueryResult> {

        return this.pool.query(`SELECT * FROM vetdb.Proprietaire WHERE '${cliniqueNumero}' = cliniqueNumero;`);
    }
    public async getCliniques(): Promise<pg.QueryResult> {

        return this.pool.query(`SELECT * FROM vetdb.clinique;`);
    }

    public async getAnimalByKey(animalNo: string, cliniqueNo: string): Promise<pg.QueryResult> {

        return this.pool.query(`SELECT * FROM vetdb.animal WHERE numero='${animalNo}' AND cliniquenumero='${cliniqueNo}';`);
    }

    public async searchAnimal(name: string): Promise<pg.QueryResult> {
        const values: string[] = [
            name
        ];

        return this.pool.query(`SELECT * FROM vetdb.animal WHERE lower(nom) LIKE '%'||($1)||'%';`, values);
    }
    public async deleteAnimal(animalNo: string, cliniqueNo: string): Promise<pg.QueryResult> {
        const VALUES: string[] = [
            animalNo,
            cliniqueNo,
        ];

        return this.pool.query(`DELETE FROM vetdb.animal WHERE numero=($1) AND cliniquenumero=($2);`, VALUES);
    }
    public async getTraitementsByAnimals(animalNo: string, cliniqueNumero: string): Promise<pg.QueryResult> {
        return this.pool.query(`SELECT DISTINCT p.*, t.*
        FROM vetdb.prescription p
        INNER JOIN vetdb.traitement t ON (p.numerotraitement  = t.numero)
        INNER JOIN vetdb.Animal a ON (p.numeroanimal = '${animalNo}')
        WHERE a.cliniquenumero = '${cliniqueNumero}'
        ;`);

    }
    public async calculateBill(animalNo: string, cliniqueNumero: string): Promise<pg.QueryResult> {
        const VALUES: string[] = [
            animalNo,
            cliniqueNumero,
        ];

        return this.pool.query(`SELECT SUM(cout) FROM vetdb.traitement WHERE numero IN (SELECT numerotraitement IN vetdb.prescription WHERE numeroanimal=($1)) AS sum);`, VALUES);
    }

    public async createAnimal(animal: Animal): Promise<pg.QueryResult> {
        const values: string[] = [
            animal.numero,
            animal.proprietaireNumero,
            animal.cliniqueNumero,
            animal.nom,
            animal.type,
            animal.description,
            animal.dateNaissance.toString(),
            animal.dateInscription.toString(),
            animal.etatActuel,

        ];
        const queryText: string = `INSERT INTO vetdb.animal VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9);`;

        return this.pool.query(queryText, values);
    }

    public async modifyAnimal(animal: Animal): Promise<pg.QueryResult> {
        const values: string[] = [
            animal.numero,
            animal.proprietaireNumero,
            animal.cliniqueNumero,
            animal.etatActuel,
            animal.description,
        ];
        const queryText: string = `UPDATE vetdb.animal SET description=($5), etatactuel=($4)
        WHERE numero=($1) AND proprietairenumero=($2);`;

        return this.pool.query(queryText, values);
    }

}
