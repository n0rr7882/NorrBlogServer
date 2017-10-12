module.exports = (sequelize, DataTypes) => {
    const post = sequelize.define('Post', {
        id: {
            field: 'id',
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            field: 'user_id',
            type: DataTypes.STRING,
            allowNull: false
        },
        category: {
            field: 'category',
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            field: 'title',
            type: DataTypes.TEXT,
            allowNull: false
        },
        views: {
            field: 'views',
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        numOfComments: {
            field: 'num_of_comments',
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        content: {
            field: 'content',
            type: DataTypes.TEXT('long'),
            allowNull: false,
        },
        creationDate: {
            field: 'creation_date',
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
            underscored: true,
            freezeTableName: true,
            tableName: 'post',
            timestamps: false
        });
    return post;
};